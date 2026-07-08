from rest_framework import serializers
from .models import DeviceToken, Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "type", "title", "body", "data", "is_read", "created_at"]


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ["id", "token", "platform"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "daily_picks_enabled", "favorite_team_alerts_enabled",
            "high_confidence_alerts_enabled", "result_alerts_enabled",
        ]