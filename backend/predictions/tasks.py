"""predictions/tasks.py — Celery: sync + generate_daily_picks."""
import logging

from celery import shared_task
from django.core.management import call_command
from django.utils import timezone

from .ml.poisson_model import predict_fixture
from .models import Match

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