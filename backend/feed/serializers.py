"""feed/serializers.py"""
from rest_framework import serializers

from .models import Card, PollVote


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ["id", "type", "match_id", "data", "created_at"]


class PollVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollVote
        fields = ["id", "card", "choice", "created_at"]
        read_only_fields = ["id", "created_at"]