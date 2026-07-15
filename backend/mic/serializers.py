from rest_framework import serializers

from .models import MicReaction, MicReactionVote


class MicReactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    avatar_url = serializers.CharField(source="user.avatar_url", read_only=True)
    vote_count = serializers.SerializerMethodField()
    user_voted = serializers.SerializerMethodField()
    user_vote_emoji = serializers.SerializerMethodField()
    vote_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = MicReaction
        fields = [
            "id", "match", "user", "username", "avatar_url", "video_url", "thumbnail_url",
            "duration_seconds", "mood", "team_side", "is_fan_of_match",
            "vote_count", "user_voted", "user_vote_emoji", "vote_breakdown", "created_at",
        ]
        read_only_fields = ["id", "user", "username", "avatar_url", "is_fan_of_match", "vote_count", "user_voted", "user_vote_emoji", "vote_breakdown", "created_at"]

    def get_vote_count(self, obj):
        return obj.votes.count()

    def get_user_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(user=request.user).exists()
        return False

    def get_user_vote_emoji(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.emoji if vote else None
        return None

    def get_vote_breakdown(self, obj):
        from django.db.models import Count
        breakdown = {}
        for emoji_choice, _ in obj._meta.get_field('votes').related_model._meta.get_field('emoji').choices:
            count = obj.votes.filter(emoji=emoji_choice).count()
            if count > 0:
                breakdown[emoji_choice] = count
        return breakdown


class MicReactionVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MicReactionVote
        fields = ["id", "mic_reaction", "emoji", "created_at"]
        read_only_fields = ["id", "created_at"]