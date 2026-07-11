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
def generate_daily_picks():
    from feed.models import Card

    today = timezone.localdate()
    todays_matches = Match.objects.filter(
        kickoff_at__date=today, status="SCHEDULED"
    ).select_related("league", "home_team", "away_team")

    created_count = skipped_count = 0

    for match in todays_matches:
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
    limit (10 req/min). Celery Beat: kila dakika 15.
    """
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

    for match in candidates:
        url = f"{base_url}/matches/{match.external_id}"
        resp = requests.get(url, headers=headers, timeout=10)

        if resp.status_code == 429:
            logger.warning("Rate limited kwenye quick sync, tunasubiri sekunde 60...")
            time.sleep(60)
            resp = requests.get(url, headers=headers, timeout=10)

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
            logger.info(f"Quick sync: Match #{match.id} -> {new_status} ({home_score}-{away_score})")

        time.sleep(6.5)  # heshimu rate limit 10 req/min

    return f"sync_live_and_upcoming_matches: {updated_count} zimebadilika kati ya {checked_count} zilizoangaliwa"