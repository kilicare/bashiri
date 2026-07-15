"""mic/tasks.py"""
import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def compute_fan_of_match():
    """
    Masaa 24 baada ya FT, hesabu MicReaction yenye votes nyingi zaidi kwa
    kila mechi, weka is_fan_of_match=True, tuma Notification kwa mshindi.
    """
    from predictions.models import Match

    from .models import MicReaction

    window_hours = settings.BASHIRI["MIC_POSTING_WINDOW_HOURS"]
    cutoff = timezone.now() - timedelta(hours=window_hours)

    matches_to_process = Match.objects.filter(
        status="FINISHED", updated_at__lte=cutoff
    ).exclude(mic_reactions__is_fan_of_match=True)

    resolved_count = 0
    for match in matches_to_process:
        reactions = MicReaction.objects.filter(match=match, is_active=True)
        if not reactions.exists():
            continue

        # Chagua yenye votes nyingi zaidi using weighted scoring (same as feed/tasks.py)
        from django.db.models import Count, Case, When, IntegerField, Sum
        
        vote_weights = {"FIRE": 3, "HUNDRED": 2}
        
        reactions_with_scores = reactions.select_related("user").annotate(
            vote_count=Count("votes"),
            weighted_score=Sum(
                Case(
                    *[When(votes__emoji=emoji, then=weight) for emoji, weight in vote_weights.items()],
                    default=1,
                    output_field=IntegerField()
                )
            )
        ).order_by("-weighted_score", "-vote_count", "-created_at")
        
        best = reactions_with_scores.first()
        if best is None or best.vote_count == 0:
            continue

        best.is_fan_of_match = True
        best.save(update_fields=["is_fan_of_match"])

        from notifications.models import Notification

        Notification.objects.create(
            user=best.user, type="HIGH_CONFIDENCE",
            title="Umeshinda Fan of the Match! 🏆",
            body=f"Video yako ya {match.home_team.name} vs {match.away_team.name} ilikuwa bora zaidi!",
            data={"mic_reaction_id": best.id, "match_id": match.id},
        )
        resolved_count += 1

    logger.info(f"compute_fan_of_match: {resolved_count} matches resolved")
    return f"Fan of the Match: {resolved_count}"