"""
notifications/tasks.py

Inatengeneza Notification records (in-app inbox). Utumaji halisi wa
FCM push (Firebase) utafanyika Phase 3 wakati wa PWA setup, kwa
kutumia DeviceToken zilizohifadhiwa hapa.
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import Notification
from .fcm import send_push_to_user

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
        send_push_to_user(
            user, "AI Picks za Leo Ziko Tayari! 🔥",
            f"Angalia predictions {today_picks.count()} za AI kwa mechi za leo.",
            click_action="/home",
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
            send_push_to_user(
                user, "Mechi ya Timu Yako Inaanza Saa 3! ⚽",
                f"{match.home_team.name} vs {match.away_team.name}",
                click_action=f"/create/{match.id}/overview",
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
            send_push_to_user(
                user, "AI Ina Uhakika Mkubwa! 🎯",
                f"Confidence {card.data['ai_pick']['confidence']}% kwa mechi ya leo.",
                click_action="/home",
            )
            count += 1
    return f"High-confidence notifications: {count}"


@shared_task
def notify_morning_picks():
    """Morning picks notification at 9 AM - Today's 5 Best Picks"""
    from accounts.models import User
    from feed.models import Card
    from .models import NotificationPreference

    # Get top 5 AI picks for today
    today_picks = Card.objects.filter(type="AI_PICK").order_by("-created_at")[:5]
    if not today_picks:
        return "Hakuna AI picks za leo."

    count = 0
    for user in User.objects.filter(is_active=True, username__isnull=False):
        pref = NotificationPreference.objects.filter(user=user).first()
        if pref and not pref.morning_picks_enabled:
            continue

        Notification.objects.create(
            user=user, type="MORNING_PICKS",
            title="Today's 5 Best Picks ☀️",
            body=f"Angalia predictions 5 bora za AI kwa mechi za leo.",
            data={"card_ids": [c.id for c in today_picks]},
        )
        count += 1
    return f"Morning picks notifications: {count}"


@shared_task
def notify_live_match_alerts():
    """Live match alerts when matches go live"""
    from accounts.models import User
    from predictions.models import Match
    from .models import NotificationPreference

    # Get matches that went live in the last hour
    one_hour_ago = timezone.now() - timedelta(hours=1)
    live_matches = Match.objects.filter(
        status="LIVE",
        updated_at__gte=one_hour_ago
    ).select_related("home_team", "away_team")

    if not live_matches:
        return "Hakuna live matches mpya."

    count = 0
    for match in live_matches:
        # Notify users who have this match saved or follow the teams
        from accounts.models import User
        from predictions.models import SavedMatch
        
        saved_match_users = User.objects.filter(
            saved_matches__match=match
        ).distinct()
        
        team_fans = User.objects.filter(
            favorite_teams__in=[match.home_team_id, match.away_team_id]
        ).distinct()
        
        target_users = (saved_match_users | team_fans).distinct()
        
        for user in target_users:
            pref = NotificationPreference.objects.filter(user=user).first()
            if pref and not pref.live_match_alerts_enabled:
                continue

            Notification.objects.create(
                user=user, type="LIVE_MATCH_ALERT",
                title=f"Mechi Inaendelea! ⚽",
                body=f"{match.home_team.name} vs {match.away_team.name} - Tazama live!",
                data={"match_id": match.id},
            )
            count += 1
    
    return f"Live match alerts: {count}"


@shared_task
def notify_evening_recap():
    """Evening recap notification - AI accuracy for the day"""
    from accounts.models import User
    from predictions.models import AIPick
    from .models import NotificationPreference

    today = timezone.localdate()
    
    # Calculate accuracy from AIPick model
    today_picks = AIPick.objects.filter(
        created_at__date=today,
        status__in=["WON", "LOST", "PUSH"]
    )
    
    total = today_picks.count()
    if total == 0:
        return "Hakuna picks zilizomaliza leo."
    
    correct = today_picks.filter(status="WON").count()
    accuracy = round((correct / total) * 100, 1)

    count = 0
    for user in User.objects.filter(is_active=True, username__isnull=False):
        pref = NotificationPreference.objects.filter(user=user).first()
        if pref and not pref.evening_recap_enabled:
            continue

        Notification.objects.create(
            user=user, type="EVENING_RECAP",
            title=f"Leo AI ilikuwa na accuracy {accuracy}% 📊",
            body=f"Total predictions: {total}, Sahihi: {correct}",
            data={
                "accuracy": accuracy,
                "total": total,
                "correct": correct,
            },
        )
        count += 1
    return f"Evening recap notifications: {count}"


@shared_task
def notify_weekly_summary():
    """Weekly summary notification - User's weekly performance"""
    from accounts.models import User
    from .models import NotificationPreference

    week_ago = timezone.now() - timedelta(days=7)
    
    count = 0
    for user in User.objects.filter(is_active=True, username__isnull=False):
        pref = NotificationPreference.objects.filter(user=user).first()
        if pref and not pref.weekly_summary_enabled:
            continue

        # Calculate user's weekly performance
        from feed.models import UserPrediction
        
        weekly_predictions = UserPrediction.objects.filter(
            user=user,
            created_at__gte=week_ago
        )
        
        total = weekly_predictions.count()
        if total == 0:
            continue
            
        correct = weekly_predictions.filter(is_correct=True).count()
        accuracy = round((correct / total) * 100, 1)
        
        # Check if user is in top 10%
        all_users = User.objects.filter(is_active=True, username__isnull=False).count()
        users_with_more_predictions = User.objects.filter(
            total_predictions__gt=user.total_predictions
        ).count()
        percentile = ((all_users - users_with_more_predictions) / all_users) * 100
        
        is_top_10 = percentile >= 90
        
        Notification.objects.create(
            user=user, type="WEEKLY_SUMMARY",
            title="Wiki hii ulikuwa top 10%! 🏆" if is_top_10 else "Weekly Summary 📈",
            body=f"Accuracy: {accuracy}% ({correct}/{total}) - Endelea kufanya vizuri!",
            data={
                "accuracy": accuracy,
                "total": total,
                "correct": correct,
                "is_top_10": is_top_10,
            },
        )
        count += 1
    return f"Weekly summary notifications: {count}"