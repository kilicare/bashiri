"""predictions/tasks.py — Celery: sync + generate_daily_picks."""
import logging
import time
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.management import call_command
from django.db.models import Q
from django.utils import timezone
import requests

from .ml.poisson_model import predict_fixture
from .models import Match, League, Team, TeamStanding, HeadToHead
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
    call_command("sync_historical", "--all-available")
    return "sync_historical imekamilika kwa seasons 2023, 2024, 2025, 2026"


@shared_task
def generate_daily_picks():
    """
    Kwa kila mechi ya LEO, tengeneza AI_PICK Card ikitumia soko BORA
    ZAIDI KATI YA MASOKO 3 YA BURE PEKEE (1X2, O/U 2.5, BTTS) — Feed
    ni content tuli (haiwezi kubadilika kwa kila mtazamaji kama
    Dashboard inavyoweza), kwa hiyo hatuwezi kuonyesha 'tease' ya soko
    lililofungwa hapa bila muktadha wa subscription ya mtu binafsi.
    
    UPDATED: Now uses canonical Recommendation Engine for consistency.
    """
    from feed.models import Card
    from .services import MARKET_DEFINITIONS
    from .recommendation_engine import generate_recommendation

    today = timezone.localdate()
    end_date = today + timedelta(days=2)  # Generate picks for today + 2 days ahead (3 days total)
    upcoming_matches = Match.objects.filter(
        kickoff_at__date__range=[today, end_date], status="SCHEDULED"
    ).select_related("league", "home_team", "away_team")

    free_market_keys = settings.BASHIRI["FREE_MARKETS"]
    created_count = 0
    skipped_count = 0
    no_pick_count = 0

    for match in upcoming_matches:
        already_exists = Card.objects.filter(type="AI_PICK", match_id=match.id).exists()
        if already_exists:
            continue

        try:
            prediction = predict_fixture(
                match.league.poisson_key, match.home_team.name, match.away_team.name
            )
        except ValueError as exc:
            logger.warning(f"Skipping AI pick kwa {match}: {exc}")
            skipped_count += 1
            continue

        # Use canonical Recommendation Engine with free market filter
        # NO HARDCODED THRESHOLDS - let the engine determine quality
        recommendation = generate_recommendation(
            prediction,
            market_filter=free_market_keys,
            min_probability=0.0,  # No hardcoded threshold
            min_confidence=0.0,  # No hardcoded threshold
        )

        if recommendation.status == "NO_STRONG_PICK":
            logger.info(f"No strong pick for {match}: {recommendation.reason}")
            no_pick_count += 1
            continue

        card_type = "BIG_MATCH" if match.is_big_match else "AI_PICK"

        Card.objects.create(
            type=card_type,
            match_id=match.id,
            data={
                "match": {
                    "home_team": match.home_team.name,
                    "away_team": match.away_team.name,
                    "league": match.league.name,
                    "kickoff_at": match.kickoff_at.isoformat(),
                    "is_big_match": match.is_big_match,
                },
                "ai_pick": {
                    "market_key": recommendation.market_key,
                    "market_label": MARKET_DEFINITIONS[recommendation.market_key]["label"],
                    "option_key": recommendation.option_key,
                    "option_label": recommendation.label,
                    "confidence": round(recommendation.raw_probability, 1),
                    "tier": recommendation.tier,
                    "data_quality": recommendation.data_quality,
                    "model_version": recommendation.model_version,
                },
                "reasons": [
                    recommendation.reason,
                ],
            },
        )
        created_count += 1

    logger.info(f"generate_daily_picks: created={created_count}, skipped={skipped_count}, no_pick={no_pick_count}")
    return f"AI Picks: created={created_count}, skipped={skipped_count}, no_pick={no_pick_count}"


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


@shared_task
def fetch_live_odds_task():
    """
    Fetch live odds using mock service for all active leagues.
    Updates odds in database and cache.
    Celery Beat: every 5 minutes.
    """
    from django.core.cache import cache
    from .odds_mock_service import generate_all_mock_odds
    
    try:
        logger.info("Starting live odds fetch task (mock service)")
        total_updated = generate_all_mock_odds(is_live=True)
        
        # Invalidate odds cache
        cache.delete("odds_list_*")
        
        logger.info(f"Live odds fetch completed: {total_updated} mock odds entries updated")
        
        # Update timestamp in cache
        cache.set("odds_last_updated", timezone.now().isoformat(), timeout=300)
        
        return f"fetch_live_odds_task: {total_updated} mock odds entries updated"
        
    except Exception as e:
        logger.error(f"Error in fetch_live_odds_task: {e}")
        return f"fetch_live_odds_task: failed - {str(e)}"


@shared_task
def fetch_upcoming_odds_task():
    """
    Fetch upcoming odds using mock service for all active leagues.
    Updates odds in database and cache.
    Celery Beat: every 15 minutes.
    """
    from django.core.cache import cache
    from .odds_mock_service import generate_all_mock_odds
    
    try:
        logger.info("Starting upcoming odds fetch task (mock service)")
        total_updated = generate_all_mock_odds(is_live=False)
        
        # Invalidate odds cache
        cache.delete("odds_list_*")
        
        logger.info(f"Upcoming odds fetch completed: {total_updated} mock odds entries updated")
        
        # Update timestamp in cache
        cache.set("odds_last_updated", timezone.now().isoformat(), timeout=900)
        
        return f"fetch_upcoming_odds_task: {total_updated} mock odds entries updated"
        
    except Exception as e:
        logger.error(f"Error in fetch_upcoming_odds_task: {e}")
        return f"fetch_upcoming_odds_task: failed - {str(e)}"


@shared_task
def fetch_team_standings_task():
    """
    Fetch current team standings from Football Data Org.
    Updates TeamStanding model for all leagues.
    Celery Beat: daily at 00:00 UTC.
    """
    try:
        logger.info("Starting team standings fetch task")
        
        headers = {"X-Auth-Token": settings.FOOTBALL_DATA_API_KEY}
        leagues = League.objects.filter(is_active=True)
        
        total_updated = 0
        
        for league in leagues:
            try:
                # Get standings from Football Data Org
                url = f"https://api.football-data.org/v4/competitions/{league.code}/standings"
                response = requests.get(url, headers=headers, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    standings = data.get("standings", [{}])[0].get("table", [])
                    
                    for standing in standings:
                        team = Team.objects.filter(
                            external_id=standing["team"]["id"],
                            league=league
                        ).first()
                        
                        if team:
                            # Calculate form rating based on last 5 matches
                            form = standing.get("form", "")
                            form_rating = calculate_form_rating(form)
                            
                            TeamStanding.objects.update_or_create(
                                team=team,
                                league=league,
                                defaults={
                                    "position": standing["position"],
                                    "matches_played": standing["playedGames"],
                                    "won": standing["won"],
                                    "draw": standing["draw"],
                                    "lost": standing["lost"],
                                    "goals_for": standing["goalsFor"],
                                    "goals_against": standing["goalsAgainst"],
                                    "goal_difference": standing["goalDifference"],
                                    "points": standing["points"],
                                    "form": form,
                                    "form_rating": form_rating,
                                }
                            )
                            total_updated += 1
                            
                # Rate limiting between leagues
                time.sleep(6.5)
                
            except Exception as e:
                logger.error(f"Error fetching standings for {league.name}: {e}")
                continue
        
        logger.info(f"Team standings fetch completed: {total_updated} standings updated")
        return f"fetch_team_standings_task: {total_updated} standings updated"
        
    except Exception as e:
        logger.error(f"Error in fetch_team_standings_task: {e}")
        return f"fetch_team_standings_task: failed - {str(e)}"


@shared_task  
def fetch_head_to_head_task():
    """
    Fetch head-to-head history between teams.
    Updates HeadToHead model for recent matches.
    Celery Beat: daily at 01:00 UTC.
    """
    try:
        logger.info("Starting head-to-head fetch task")
        
        headers = {"X-Auth-Token": settings.FOOTBALL_DATA_API_KEY}
        
        # Get recent finished matches for H2H analysis
        date_from = (timezone.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        date_to = timezone.now().strftime("%Y-%m-%d")
        
        leagues = League.objects.filter(is_active=True)
        total_updated = 0
        
        for league in leagues:
            try:
                url = f"https://api.football-data.org/v4/competitions/{league.code}/matches"
                params = {"dateFrom": date_from, "dateTo": date_to, "status": "FINISHED"}
                response = requests.get(url, headers=headers, params=params, timeout=15)
                
                if response.status_code == 200:
                    matches = response.json().get("matches", [])
                    
                    # Process matches for H2H data
                    h2h_data = {}
                    
                    for match in matches:
                        home_team_id = match["homeTeam"]["id"]
                        away_team_id = match["awayTeam"]["id"]
                        
                        # Create unique key for team pair (sorted to avoid duplicates)
                        team_pair = tuple(sorted([home_team_id, away_team_id]))
                        
                        if team_pair not in h2h_data:
                            h2h_data[team_pair] = {
                                "total_matches": 0,
                                "home_wins": 0,
                                "draws": 0,
                                "away_wins": 0,
                                "home_goals": 0,
                                "away_goals": 0,
                                "last_5_matches": []
                            }
                        
                        # Update H2H stats
                        h2h = h2h_data[team_pair]
                        h2h["total_matches"] += 1
                        
                        if match["score"]["fullTime"]["home"] > match["score"]["fullTime"]["away"]:
                            if home_team_id == team_pair[0]:
                                h2h["home_wins"] += 1
                            else:
                                h2h["away_wins"] += 1
                        elif match["score"]["fullTime"]["home"] < match["score"]["fullTime"]["away"]:
                            if away_team_id == team_pair[0]:
                                h2h["home_wins"] += 1
                            else:
                                h2h["away_wins"] += 1
                        else:
                            h2h["draws"] += 1
                        
                        h2h["home_goals"] += match["score"]["fullTime"]["home"]
                        h2h["away_goals"] += match["score"]["fullTime"]["away"]
                        
                        # Add to last 5 matches
                        match_result = "W" if (
                            (home_team_id == team_pair[0] and match["score"]["fullTime"]["home"] > match["score"]["fullTime"]["away"]) or
                            (away_team_id == team_pair[0] and match["score"]["fullTime"]["home"] < match["score"]["fullTime"]["away"])
                        ) else "L" if match["score"]["fullTime"]["home"] == match["score"]["fullTime"]["away"] else "D"
                        
                        h2h["last_5_matches"].append({
                            "date": match["utcDate"],
                            "result": match_result,
                            "score": f"{match['score']['fullTime']['home']}-{match['score']['fullTime']['away']}"
                        })
                        
                        # Keep only last 5 matches
                        if len(h2h["last_5_matches"]) > 5:
                            h2h["last_5_matches"] = h2h["last_5_matches"][-5:]
                    
                    # Save H2H data to database
                    for team_pair, h2h in h2h_data.items():
                        home_team = Team.objects.filter(external_id=team_pair[0], league=league).first()
                        away_team = Team.objects.filter(external_id=team_pair[1], league=league).first()
                        
                        if home_team and away_team:
                            HeadToHead.objects.update_or_create(
                                home_team=home_team,
                                away_team=away_team,
                                league=league,
                                defaults={
                                    "total_matches": h2h["total_matches"],
                                    "home_wins": h2h["home_wins"],
                                    "draws": h2h["draws"],
                                    "away_wins": h2h["away_wins"],
                                    "home_goals": h2h["home_goals"],
                                    "away_goals": h2h["away_goals"],
                                    "last_5_matches": h2h["last_5_matches"],
                                }
                            )
                            total_updated += 1
                
                # Rate limiting between leagues
                time.sleep(6.5)
                
            except Exception as e:
                logger.error(f"Error fetching H2H for {league.name}: {e}")
                continue
        
        logger.info(f"Head-to-head fetch completed: {total_updated} H2H records updated")
        return f"fetch_head_to_head_task: {total_updated} H2H records updated"
        
    except Exception as e:
        logger.error(f"Error in fetch_head_to_head_task: {e}")
        return f"fetch_head_to_head_task: failed - {str(e)}"


def calculate_form_rating(form_string: str) -> float:
    """
    Calculate form rating (0-100) based on last 5 matches form string.
    W = 100 points, D = 50 points, L = 0 points.
    """
    if not form_string:
        return 50.0
    
    total = 0
    count = 0
    
    for char in form_string.upper():
        if char == 'W':
            total += 100
        elif char == 'D':
            total += 50
        elif char == 'L':
            total += 0
        count += 1
    
    return (total / count) if count > 0 else 50.0