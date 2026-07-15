from rest_framework import serializers

from .models import Card, PollVote, UserPrediction


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ["id", "type", "match_id", "data", "created_at"]


class UserPredictionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPrediction
        fields = ["id", "match", "market", "selection", "note", "emoji", "matched_ai_pick", "created_at"]
        read_only_fields = ["id", "matched_ai_pick", "created_at"]

    def validate_note(self, value):
        if len(value) > 150:
            raise serializers.ValidationError("Maelezo yasizidi herufi 150.")
        return value


class PollVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollVote
        fields = ["id", "card", "choice", "created_at"]
        read_only_fields = ["id", "created_at"]