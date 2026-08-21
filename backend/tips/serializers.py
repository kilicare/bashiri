from rest_framework import serializers
from django.utils import timezone
from django.core.cache import cache
from .models import UserTip, TipPerformance, TipComment, TipVote, TipShare
from accounts.models import User
from predictions.models import Match


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for tip display"""
    
    tip_accuracy = serializers.SerializerMethodField()
    total_tips = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'avatar_url', 'verified_tipster',
            'tip_accuracy', 'total_tips', 'followers_count'
        ]
    
    def get_tip_accuracy(self, obj):
        return obj.get_tip_accuracy()
    
    def get_total_tips(self, obj):
        return obj.get_total_tips()


class MatchMinimalSerializer(serializers.ModelSerializer):
    """Minimal match info for tip display"""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    league_code = serializers.CharField(source='league.code', read_only=True)
    league_name = serializers.CharField(source='league.name', read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'home_team_name', 'away_team_name',
            'league_code', 'league_name', 'kickoff_at',
            'status', 'home_score', 'away_score'
        ]


class TipCommentSerializer(serializers.ModelSerializer):
    """Tip comment serializer"""
    
    user = UserMinimalSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = TipComment
        fields = [
            'id', 'user', 'content', 'created_at',
            'updated_at', 'replies'
        ]
    
    def get_replies(self, obj):
        """Get nested replies"""
        replies = obj.replies.all()
        return TipCommentSerializer(replies, many=True).data


class UserTipSerializer(serializers.ModelSerializer):
    """Complete tip serializer for detail view"""
    
    user = UserMinimalSerializer(read_only=True)
    match = MatchMinimalSerializer(read_only=True)
    market_label = serializers.CharField(source='get_market_label', read_only=True)
    selection_label = serializers.CharField(source='get_selection_label', read_only=True)
    net_votes = serializers.SerializerMethodField()
    engagement_score = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    comments = TipCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserTip
        fields = [
            'id', 'user', 'match', 'market_key', 'market_label',
            'selection', 'selection_label', 'confidence', 'reasoning',
            'status', 'visibility', 'views_count', 'upvotes_count',
            'downvotes_count', 'comments_count', 'net_votes',
            'engagement_score', 'user_vote', 'comments',
            'created_at', 'updated_at', 'verified_at'
        ]
        read_only_fields = [
            'user', 'status', 'views_count', 'upvotes_count',
            'downvotes_count', 'comments_count', 'verified_at'
        ]
    
    def get_net_votes(self, obj):
        return obj.net_votes
    
    def get_engagement_score(self, obj):
        return round(obj.engagement_score, 2)
    
    def get_user_vote(self, obj):
        """Check if current user has voted"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        try:
            vote = TipVote.objects.get(tip=obj, user=request.user)
            return vote.vote
        except TipVote.DoesNotExist:
            return None


class UserTipListSerializer(serializers.ModelSerializer):
    """Simplified tip serializer for list view"""
    
    user = UserMinimalSerializer(read_only=True)
    market_label = serializers.CharField(source='get_market_label', read_only=True)
    selection_label = serializers.CharField(source='get_selection_label', read_only=True)
    home_team = serializers.CharField(source='match.home_team.name', read_only=True)
    away_team = serializers.CharField(source='match.away_team.name', read_only=True)
    league_name = serializers.CharField(source='match.league.name', read_only=True)
    
    class Meta:
        model = UserTip
        fields = [
            'id', 'user', 'home_team', 'away_team', 'league_name',
            'market_key', 'market_label', 'selection', 'selection_label',
            'confidence', 'status', 'views_count', 'upvotes_count',
            'downvotes_count', 'comments_count', 'created_at'
        ]


class CreateTipSerializer(serializers.ModelSerializer):
    """Serializer for creating new tips"""
    
    class Meta:
        model = UserTip
        fields = [
            'match', 'market_key', 'selection', 'confidence',
            'reasoning', 'visibility'
        ]
    
    def validate_match(self, value):
        """Ensure match is scheduled and in future"""
        if value.status != "SCHEDULED":
            raise serializers.ValidationError(
                "Tips can only be created for scheduled matches"
            )
        if value.kickoff_at < timezone.now():
            raise serializers.ValidationError(
                "Cannot create tips for past matches"
            )
        return value
    
    def validate_market_key(self, value):
        """Validate market key"""
        valid_markets = [
            '1X2', 'DRAW_NO_BET', 'OVER_UNDER_0_5', 'OVER_UNDER_1_5',
            'OVER_UNDER_2_5', 'OVER_UNDER_3_5', 'OVER_UNDER_4_5',
            'BTTS', 'DOUBLE_CHANCE', 'CORRECT_SCORE'
        ]
        if value not in valid_markets:
            raise serializers.ValidationError(
                f"Invalid market. Must be one of: {', '.join(valid_markets)}"
            )
        return value
    
    def validate_confidence(self, value):
        """Ensure confidence is between 0-100"""
        if not (0 <= value <= 100):
            raise serializers.ValidationError(
                "Confidence must be between 0 and 100"
            )
        return value
    
    def create(self, validated_data):
        """Create tip and update user stats"""
        tip = UserTip.objects.create(
            user=self.context['request'].user,
            **validated_data
        )
        
        # Update user tip count
        user = self.context['request'].user
        user.tip_count += 1
        user.save(update_fields=['tip_count'])
        
        # Get or create performance record
        perf, _ = TipPerformance.objects.get_or_create(user=user)
        perf.total_tips += 1
        perf.save(update_fields=['total_tips'])
        
        # Invalidate cache
        cache.delete_pattern("tips:list:*")
        cache.delete("tips:leaderboard")
        
        return tip


class UpdateTipSerializer(serializers.ModelSerializer):
    """Serializer for updating tips (before match starts)"""
    
    class Meta:
        model = UserTip
        fields = ['market_key', 'selection', 'confidence', 'reasoning', 'visibility']
    
    def validate_match(self, value):
        """Ensure match is still in future"""
        if value.kickoff_at < timezone.now():
            raise serializers.ValidationError(
                "Cannot update tips for matches that have started"
            )
        return value


class TipPerformanceSerializer(serializers.ModelSerializer):
    """User tip performance/statistics"""
    
    user = UserMinimalSerializer(read_only=True)
    rank = serializers.SerializerMethodField()
    
    class Meta:
        model = TipPerformance
        fields = [
            'id', 'user', 'rank', 'total_tips', 'correct_tips',
            'incorrect_tips', 'void_tips', 'accuracy_percentage',
            'tips_1x2', 'accuracy_1x2', 'tips_btts', 'accuracy_btts',
            'tips_over_under', 'accuracy_over_under', 'tips_double_chance',
            'accuracy_double_chance', 'current_streak', 'best_streak',
            'followers_count', 'total_upvotes_received', 'updated_at'
        ]
    
    def get_rank(self, obj):
        """Get user's rank in leaderboard"""
        # Cache this to avoid expensive queries
        cache_key = f"tip_rank:{obj.user_id}"
        rank = cache.get(cache_key)
        
        if rank is None:
            rank = TipPerformance.objects.filter(
                total_tips__gte=10,
                accuracy_percentage__gte=obj.accuracy_percentage
            ).count()
            cache.set(cache_key, rank, 300)  # 5 min cache
        
        return rank