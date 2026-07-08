from rest_framework import serializers

from .models import Card, PollVote, UserPrediction


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ["id", "type", "match_id", "data", "created_at"]


class UserPredictionCreateSerializer(serializers.ModelSerializer):
    match_details = serializers.SerializerMethodField()

    class Meta:
        model = UserPrediction
        fields = ["id", "match", "match_details", "market", "selection", "note", "emoji", "is_correct", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_match_details(self, obj):
        if obj.match:
            from predictions.serializers import MatchListSerializer
            return MatchListSerializer(obj.match).data
        return None

    def validate_note(self, value):
        if len(value) > 150:
            raise serializers.ValidationError("Maelezo yasizidi herufi 150.")
        return value


class PollVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollVote
        fields = ["id", "card", "choice", "created_at"]
        read_only_fields = ["id", "created_at"]