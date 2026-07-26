"""predictions/tasks.py — Celery: sync + generate_daily_picks."""
import logging
import time
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.management import call_command
from django.db.models import Q
from django.utils import timezone

from .ml.poisson_model import predict_fixture
from .models import Match
from .sync_service import STATUS_MAP

logger = logging.getLogger(__name__)


@shared_task
def sync_daily_task():
    """
    Celery task for daily incremental sync.
    This is the ONLY sync task that should be scheduled via Celery Beat.
    Historical sync must NEVER be scheduled automatically.
    """
    call_command("sync_daily")
    return "sync_daily imekamilika"


@shared_task
def sync_historical_task():
    """
    Celery task for historical sync (seasons 2023, 2024, 2025, 2026).
    This should be run ONCE then disabled from Celery Beat.
    """
    call_command("sync_historical", "--seasons", "2023", "2024", "2025", "2026")
    return "sync_historical imekamilika kwa seasons 2023, 2024, 2025, 2026"


@shared_task
def generate_daily_picks():
    from feed.models import Card

    today = timezone.localdate()
    end_date = today + timedelta(days=2)  # Generate picks for today + 2 days ahead (3 days total)
    upcoming_matches = Match.objects.filter(
        kickoff_at__date__range=[today, end_date], status="SCHEDULED"
    ).select_related("league", "home_team", "away_team")

    created_count = skipped_count = 0

    for match in upcoming_matches:
        if Card.objects.filter(type="AI_PICK", match_id=match.id).exists():
            continue
        try:
            prediction = predict_fixture(match.league.poisson_key, match.home_team.name, match.away_team.name)
        except ValueError as exc:
            logger.warning(f"Skipping AI pick kwa {match}: {exc}")
            skipped_count += 1
            continue

        Card.objects.create(
            type="AI_PICK", match_id=match.id,
            data={
                "match": {
                    "home_team": match.home_team.name, "away_team": match.away_team.name,
                    "league": match.league.name, "kickoff_at": match.kickoff_at.isoformat(),
                    "is_big_match": match.is_big_match,
                },
                "ai_pick": prediction["ai_pick"],
                "expected_goals": prediction["expected_goals"],
                "reasons": [
                    f"AI confidence: {prediction['ai_pick']['confidence']}%",
                    f"Expected goals: {prediction['expected_goals']['home_xg']} - {prediction['expected_goals']['away_xg']}",
                    f"BTTS: {prediction['btts']['yes']}%",
                ],
            },
        )
        created_count += 1

    logger.info(f"generate_daily_picks: created={created_count}, skipped={skipped_count}")
    return f"AI Picks: created={created_count}, skipped={skipped_count}"


@shared_task
def sync_live_and_upcoming_matches():
    """
    Sync NDOGO, ya HARAKA — inasasisha status/score za mechi zinazoweza
    kubadilika HIVI SASA pekee (kickoff imepita lakini bado 'SCHEDULED',
    au tayari 'LIVE'). Haivuti ligi nzima — inaita football-data.org
    /matches/{id} kwa kila mechi husika pekee, ili kubaki ndani ya rate
    limit (10 req/min). Celery Beat: kila dakika 1.
    """
    from django.core.cache import cache

    api_key = settings.FOOTBALL_DATA_API_KEY
    if not api_key:
        logger.error("FOOTBALL_DATA_API_KEY haijawekwa — sync_live_and_upcoming_matches imesimama.")
        return "FOOTBALL_DATA_API_KEY haijawekwa."

    import requests

    headers = {"X-Auth-Token": api_key}
    base_url = settings.BASHIRI["FOOTBALL_DATA_BASE_URL"]
    now = timezone.now()

    candidates = Match.objects.filter(
        Q(status="LIVE")
        | Q(status="SCHEDULED", kickoff_at__lte=now, kickoff_at__gte=now - timedelta(hours=4))
    )[:20]  # kikomo cha usalama dhidi ya rate limit kwa run moja

    if not candidates:
        return "sync_live_and_upcoming_matches: hakuna mechi za kuangalia sasa."

    updated_count = 0
    checked_count = 0
    data_changed = False

    for match in candidates:
        url = f"{base_url}/matches/{match.external_id}"
        resp = requests.get(url, headers=headers, timeout=20)

        if resp.status_code == 429:
            logger.warning("Rate limited kwenye quick sync, tunasubiri sekunde 60...")
            time.sleep(60)
            resp = requests.get(url, headers=headers, timeout=20)

        if resp.status_code != 200:
            logger.warning(f"Quick sync: error {resp.status_code} kwa match #{match.id}")
            time.sleep(6.5)
            continue

        checked_count += 1
        data = resp.json()
        new_status = STATUS_MAP.get(data["status"], match.status)
        home_score = data["score"]["fullTime"]["home"]
        away_score = data["score"]["fullTime"]["away"]

        changed = (
            new_status != match.status
            or home_score != match.home_score
            or away_score != match.away_score
        )
        if changed:
            match.status = new_status
            match.home_score = home_score
            match.away_score = away_score
            match.save(update_fields=["status", "home_score", "away_score", "updated_at"])
            updated_count += 1
            data_changed = True
            logger.info(f"Quick sync: Match #{match.id} -> {new_status} ({home_score}-{away_score})")

        time.sleep(6.5)  # heshimu rate limit 10 req/min

    # Invalidate cache if any live match data changed
    if data_changed:
        cache.delete("live_matches")
        logger.info("Cache invalidated: live_matches")

    return f"sync_live_and_upcoming_matches: {updated_count} zimebadilika kati ya {checked_count} zilizoangaliwa"


@shared_task
def sync_recently_finished_matches():
    """
    Sync mechi zilizoisha hivi karibuni (masaa 24-48 zilopita).
    Hii inahakikisha mechi zilizoisha jana zinasasishwa haraka
    badala ya kusubiri sync_daily ya asubuhi.
    Celery Beat: kila dakika 30.
    """
    from django.core.cache import cache

    api_key = settings.FOOTBALL_DATA_API_KEY
    if not api_key:
        logger.error("FOOTBALL_DATA_API_KEY haijawekwa — sync_recently_finished_matches imesimama.")
        return "FOOTBALL_DATA_API_KEY haijawekwa."

    import requests

    headers = {"X-Auth-Token": api_key}
    base_url = settings.BASHIRI["FOOTBALL_DATA_BASE_URL"]
    now = timezone.now()

    # Angalia mechi zilizoisha ndani ya masaa 48 zilopita
    candidates = Match.objects.filter(
        Q(status="SCHEDULED") | Q(status="LIVE"),
        kickoff_at__gte=now - timedelta(hours=48),
        kickoff_at__lte=now - timedelta(hours=1)  # Epuka mechi zinazoendelea
    ).select_related("league", "home_team", "away_team")[:15]

    if not candidates:
        return "sync_recently_finished_matches: hakuna mechi za kuangalia."

    updated_count = 0
    checked_count = 0
    data_changed = False

    for match in candidates:
        url = f"{base_url}/matches/{match.external_id}"
        resp = requests.get(url, headers=headers, timeout=20)

        if resp.status_code == 429:
            logger.warning("Rate limited kwenye finished matches sync, tunasubiri sekunde 60...")
            time.sleep(60)
            resp = requests.get(url, headers=headers, timeout=20)

        if resp.status_code != 200:
            logger.warning(f"Finished sync: error {resp.status_code} kwa match #{match.id}")
            time.sleep(6.5)
            continue

        checked_count += 1
        data = resp.json()
        new_status = STATUS_MAP.get(data["status"], match.status)
        home_score = data["score"]["fullTime"]["home"]
        away_score = data["score"]["fullTime"]["away"]

        changed = (
            new_status != match.status
            or home_score != match.home_score
            or away_score != match.away_score
        )
        if changed:
            match.status = new_status
            match.home_score = home_score
            match.away_score = away_score
            match.save(update_fields=["status", "home_score", "away_score", "updated_at"])
            updated_count += 1
            data_changed = True
            logger.info(f"Finished sync: Match #{match.id} -> {new_status} ({home_score}-{away_score})")

        time.sleep(6.5)  # heshimu rate limit 10 req/min

    # Invalidate cache if any finished match data changed
    if data_changed:
        cache.delete("live_matches")
        cache.delete("feed_list")
        # Invalidate all finished matches cache keys
        cache.delete_many([key for key in cache.keys("finished_matches_*")])
        logger.info("Cache invalidated: live_matches, feed_list, and finished_matches_*")

    return f"sync_recently_finished_matches: {updated_count} zimebadilika kati ya {checked_count} zilizoangaliwa"


@shared_task
def generate_ai_track_record_snapshot():
    """
    Kila siku (04:00), hesabu upya utendaji wa AI kwa mechi ZOTE
    zilizokwisha (per-market accuracy — ligi zote na kila ligi peke
    yake), weekly trend (kutoka RESULT_RECAP cards), na 'boldest correct
    calls' (chaguo za ujasiri zilizotokea). Hifadhi kama snapshot MOJA.
    """
    from feed.models import Card

    from .models import AITrackRecordSnapshot
    from .services import MARKET_DEFINITIONS, is_prediction_correct

    finished_matches = Match.objects.filter(
        status="FINISHED", home_score__isnull=False, away_score__isnull=False
    ).select_related("league", "home_team", "away_team")

    market_keys = list(MARKET_DEFINITIONS.keys())

    def empty_stats():
        return {k: {"correct": 0, "total": 0} for k in market_keys}

    overall_stats = empty_stats()
    league_stats = {}

    for match in finished_matches:
        try:
            prediction = predict_fixture(
                match.league.poisson_key, match.home_team.name, match.away_team.name
            )
        except ValueError:
            continue

        league_key = match.league.poisson_key
        if league_key not in league_stats:
            league_stats[league_key] = empty_stats()

        for market_key in market_keys:
            definition = MARKET_DEFINITIONS[market_key]
            source_data = prediction[definition["source_key"]]
            best_key = max(definition["options"], key=lambda o: source_data[o["key"]])["key"]
            correct = is_prediction_correct(market_key, best_key, match.home_score, match.away_score)

            overall_stats[market_key]["total"] += 1
            league_stats[league_key][market_key]["total"] += 1
            if correct:
                overall_stats[market_key]["correct"] += 1
                league_stats[league_key][market_key]["correct"] += 1

    def finalize(stats):
        result = {}
        for k, v in stats.items():
            pct = round((v["correct"] / v["total"]) * 100, 1) if v["total"] else 0.0
            result[k] = {"correct": v["correct"], "total": v["total"], "accuracy_percentage": pct}
        return result

    overall_finalized = finalize(overall_stats)
    leagues_finalized = {lk: {"markets": finalize(lv)} for lk, lv in league_stats.items()}

    # Weekly trend (1X2, wiki 8 za mwisho) — kutoka RESULT_RECAP cards zilizoshahifadhiwa (haraka)
    weekly_trend = []
    now = timezone.now()
    for i in range(7, -1, -1):
        week_end = now - timedelta(weeks=i)
        week_start = week_end - timedelta(days=7)
        recaps = Card.objects.filter(
            type="RESULT_RECAP", created_at__gte=week_start, created_at__lt=week_end
        )
        total = recaps.count()
        if total == 0:
            continue
        correct = sum(1 for r in recaps if r.data.get("was_correct"))
        weekly_trend.append({
            "week_start": week_start.date().isoformat(),
            "accuracy_percentage": round((correct / total) * 100, 1),
        })

    # Boldest correct calls — RESULT_RECAP zenye was_correct=True, ai_confidence ndogo zaidi
    # (sorting kwa Python, si DB JSON ordering, kuepuka makoso ya string-vs-number comparison)
    candidates = list(
        Card.objects.filter(type="RESULT_RECAP", data__was_correct=True)
        .select_related("match", "match__home_team", "match__away_team")
        .order_by("-created_at")[:200]
    )
    candidates.sort(key=lambda c: c.data.get("ai_confidence", 100))

    boldest_calls = []
    for card in candidates[:5]:
        if not card.match_id:
            continue
        boldest_calls.append({
            "match_id": card.match_id,
            "home_team": card.match.home_team.name,
            "away_team": card.match.away_team.name,
            "ai_confidence": card.data.get("ai_confidence"),
            "ai_predicted": card.data.get("ai_predicted"),
            "date": card.created_at.date().isoformat(),
        })

    AITrackRecordSnapshot.objects.create(data={
        "overall": {"markets": overall_finalized},
        "leagues": leagues_finalized,
        "weekly_trend": weekly_trend,
        "boldest_calls": boldest_calls,
    })

    # Weka snapshots 30 za mwisho pekee (epuka database kujaa)
    old_ids = list(
        AITrackRecordSnapshot.objects.order_by("-generated_at").values_list("id", flat=True)[30:]
    )
    if old_ids:
        AITrackRecordSnapshot.objects.filter(id__in=old_ids).delete()

    return f"AI Track Record snapshot: mechi {finished_matches.count()} zimechambuliwa"