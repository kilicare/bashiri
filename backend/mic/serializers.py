from rest_framework import serializers

from .models import MicReaction, MicReactionVote


class MicReactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    vote_count = serializers.SerializerMethodField()

    class Meta:
        model = MicReaction
        fields = [
            "id", "match", "user", "username", "video_url", "thumbnail_url",
            "duration_seconds", "mood", "team_side", "is_fan_of_match",
            "vote_count", "created_at",
        ]
        read_only_fields = ["id", "user", "username", "is_fan_of_match", "vote_count", "created_at"]

    def get_vote_count(self, obj):
        return obj.votes.count()


class MicReactionVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MicReactionVote
        fields = ["id", "mic_reaction", "emoji", "created_at"]
        read_only_fields = ["id", "created_at"]