from rest_framework import serializers

from .models import MatchRoomMessage


class MatchRoomMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = MatchRoomMessage
        fields = ["id", "username", "content", "created_at"]
        read_only_fields = fields