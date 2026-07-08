from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ("DAILY_PICKS", "Daily Picks"),
        ("FAVORITE_TEAM_MATCH", "Favorite Team Match"),
        ("HIGH_CONFIDENCE", "High Confidence Alert"),
        ("RESULT", "Result"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=150)
    body = models.CharField(max_length=300)
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]


class DeviceToken(models.Model):
    """FCM (Firebase Cloud Messaging) device token — kwa push delivery halisi Phase 3."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens")
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=20, default="web")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_devicetoken"


class NotificationPreference(models.Model):
    """Mtumiaji anachagua ni notification gani anataka kupokea. Tasks (tasks.py) ZINAHESHIMU haya."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preference")
    daily_picks_enabled = models.BooleanField(default=True)
    favorite_team_alerts_enabled = models.BooleanField(default=True)
    high_confidence_alerts_enabled = models.BooleanField(default=True)
    result_alerts_enabled = models.BooleanField(default=True)

    class Meta:
        db_table = "notifications_preference"
