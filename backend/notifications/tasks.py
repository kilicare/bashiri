"""
notifications/tasks.py

Inatengeneza Notification records (in-app inbox). Utumaji halisi wa
FCM push (Firebase) utafanyika Phase 3 wakati wa PWA setup, kwa
kutumia DeviceToken zilizohifadhiwa hapa.
"""
import logging

from celery import shared_task

from .models import Notification

logger = logging.getLogger(__name__)


@shared_task
def notify_daily_picks():
    from accounts.models import User
    from feed.models import Card
    from .models import NotificationPreference

    today_picks = Card.objects.filter(type="AI_PICK").order_by("-created_at")[:5]
    if not today_picks:
        return "Hakuna AI picks za leo."

    count = 0
    for user in User.objects.filter(is_active=True, username__isnull=False):
        pref = NotificationPreference.objects.filter(user=user).first()
        if pref and not pref.daily_picks_enabled:
            continue

        Notification.objects.create(
            user=user, type="DAILY_PICKS",
            title="AI Picks za Leo Ziko Tayari! 🔥",
            body=f"Angalia predictions {today_picks.count()} za AI kwa mechi za leo.",
            data={"card_ids": [c.id for c in today_picks]},
        )
        count += 1
    return f"Notifications zilizotumwa: {count}"


@shared_task
def notify_favorite_team_matches():
    from datetime import timedelta

    from django.utils import timezone

    from accounts.models import User
    from predictions.models import Match
    from .models import NotificationPreference

    upcoming = Match.objects.filter(
        status="SCHEDULED",
        kickoff_at__gte=timezone.now(),
        kickoff_at__lte=timezone.now() + timedelta(hours=3),
    ).select_related("home_team", "away_team")

    count = 0
    for match in upcoming:
        team_ids = [match.home_team_id, match.away_team_id]
        fans = User.objects.filter(favorite_teams__id__in=team_ids).distinct()
        for user in fans:
            pref = NotificationPreference.objects.filter(user=user).first()
            if pref and not pref.favorite_team_alerts_enabled:
                continue

            Notification.objects.create(
                user=user, type="FAVORITE_TEAM_MATCH",
                title="Mechi ya Timu Yako Inaanza Saa 3! ⚽",
                body=f"{match.home_team.name} vs {match.away_team.name}",
                data={"match_id": match.id},
            )
            count += 1
    return f"Notifications za favorite team: {count}"


@shared_task
def notify_high_confidence_picks():
    from feed.models import Card
    from .models import NotificationPreference

    high_conf_cards = [
        c for c in Card.objects.filter(type="AI_PICK").order_by("-created_at")[:20]
        if c.data.get("ai_pick", {}).get("confidence", 0) >= 85
    ]

    if not high_conf_cards:
        return "Hakuna high-confidence picks."

    from accounts.models import User

    count = 0
    for user in User.objects.filter(is_active=True, username__isnull=False):
        pref = NotificationPreference.objects.filter(user=user).first()
        if pref and not pref.high_confidence_alerts_enabled:
            continue

        for card in high_conf_cards:
            Notification.objects.create(
                user=user, type="HIGH_CONFIDENCE",
                title="AI Ina Uhakika Mkubwa! 🎯",
                body=f"Confidence {card.data['ai_pick']['confidence']}% kwa mechi ya leo.",
                data={"card_id": card.id},
            )
            count += 1
    return f"High-confidence notifications: {count}"