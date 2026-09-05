from rest_framework import serializers
from django.utils import timezone
from django.core.cache import cache
import logging

from .models import (
    UserTip, TipPerformance, TipComment, TipVote, 
    TipShare, TipAISnapshot, TipSlip, TipSlipLeg
)
from .market_registry import (
    get_available_market_keys,
    is_valid_selection,
    normalize_selection_key,
)
from accounts.models import User
from predictions.models import Match

logger = logging.getLogger(__name__)


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for tip display"""
    
    tip_accuracy = serializers.SerializerMethodField()
    total_tips = serializers.SerializerMethodField()
    tipster_score = serializers.SerializerMethodField()
    current_streak = serializers.SerializerMethodField()
    best_streak = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'avatar_url', 'verified_tipster',
            'tip_accuracy', 'total_tips', 'tipster_score', 'followers_count',
            'current_streak', 'best_streak'
        ]
    
    def get_tip_accuracy(self, obj):
        return obj.get_tip_accuracy()
    
    def get_total_tips(self, obj):
        return obj.get_total_tips()
    
    def get_tipster_score(self, obj):
        return getattr(obj, 'tipster_score', 0)
    
    def get_current_streak(self, obj):
        return getattr(obj, 'current_streak', 0)
    
    def get_best_streak(self, obj):
        return getattr(obj, 'best_streak', 0)


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
    is_locked = serializers.BooleanField(read_only=True)
    ai_snapshot = serializers.SerializerMethodField()
    comments = TipCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserTip
        fields = [
            'id', 'user', 'match', 'market_key', 'market_label',
            'selection', 'selection_label', 'confidence', 'reasoning',
            'status', 'visibility', 'views_count', 'upvotes_count',
            'downvotes_count', 'comments_count', 'net_votes',
            'engagement_score', 'user_vote', 'is_locked', 'ai_snapshot', 'comments',
            'created_at', 'updated_at', 'verified_at', 'locked_at'
        ]
        read_only_fields = [
            'user', 'status', 'views_count', 'upvotes_count',
            'downvotes_count', 'comments_count', 'verified_at', 'locked_at'
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
    
    def get_ai_snapshot(self, obj):
        """Get AI snapshot if available"""
        try:
            snapshot = obj.ai_snapshot
            return {
                'model_version': snapshot.model_version,
                'prediction_generated_at': snapshot.prediction_generated_at,
                'raw_probability': snapshot.raw_probability,
                'calibrated_probability': snapshot.calibrated_probability,
                'recommendation_tier': snapshot.recommendation_tier,
                'data_quality': snapshot.data_quality,
                'confidence_score': snapshot.confidence_score,
                'ai_agrees': snapshot.ai_agrees,
            }
        except TipAISnapshot.DoesNotExist:
            return None


class UserTipListSerializer(serializers.ModelSerializer):
    """Simplified tip serializer for list view"""
    
    user = UserMinimalSerializer(read_only=True)
    market_label = serializers.CharField(source='get_market_label', read_only=True)
    selection_label = serializers.CharField(source='get_selection_label', read_only=True)
    home_team = serializers.CharField(source='match.home_team.name', read_only=True)
    away_team = serializers.CharField(source='match.away_team.name', read_only=True)
    league_name = serializers.CharField(source='match.league.name', read_only=True)
    kickoff_at = serializers.DateTimeField(source='match.kickoff_at', read_only=True)
    is_locked = serializers.BooleanField(read_only=True)
    ai_agrees = serializers.SerializerMethodField()
    
    class Meta:
        model = UserTip
        fields = [
            'id', 'user', 'home_team', 'away_team', 'league_name', 'kickoff_at',
            'market_key', 'market_label', 'selection', 'selection_label',
            'confidence', 'status', 'views_count', 'upvotes_count',
            'downvotes_count', 'comments_count', 'is_locked', 'ai_agrees', 'created_at'
        ]
    
    def get_ai_agrees(self, obj):
        """Check if tip agrees with AI recommendation"""
        try:
            snapshot = obj.ai_snapshot
            return snapshot.ai_agrees
        except TipAISnapshot.DoesNotExist:
            return None


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
        """Validate market key using centralized registry"""
        from .market_registry import validate_market_key
        
        if not validate_market_key(value):
            raise serializers.ValidationError(
                f"Invalid market. Available markets: {', '.join(get_available_market_keys())}"
            )
        return value
    
    def validate_confidence(self, value):
        """Ensure confidence is between 0-100"""
        if not (0 <= value <= 100):
            raise serializers.ValidationError(
                "Confidence must be between 0 and 100"
            )
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        market_key = attrs.get('market_key')
        selection = attrs.get('selection')
        match = attrs.get('match')
        
        # Normalize selection key to canonical form
        if market_key and selection:
            normalized_selection = normalize_selection_key(market_key, selection)
            attrs['selection'] = normalized_selection
            
            # Validate selection is valid for the market
            if not is_valid_selection(market_key, normalized_selection):
                raise serializers.ValidationError(
                    f"Invalid selection '{selection}' for market '{market_key}'"
                )
        
        # Allow multiple tips per match, but prevent exact duplicates
        # (same user, same match, same market, same selection)
        if self.context.get('request') and match and market_key and selection:
            user = self.context['request'].user
            existing_tip = UserTip.objects.filter(
                user=user,
                match=match,
                market_key=market_key,
                selection=attrs['selection']
            ).first()
            
            if existing_tip:
                raise serializers.ValidationError(
                    "You have already created this exact tip for this match."
                )
        
        return attrs
    
    def create(self, validated_data):
        """Create tip, capture AI snapshot, and update user stats"""
        user = self.context['request'].user
        match = validated_data['match']
        market_key = validated_data['market_key']
        selection = validated_data['selection']
        
        # Create tip
        tip = UserTip.objects.create(
            user=user,
            **validated_data
        )
        
        # Capture AI snapshot
        try:
            from predictions.ml.poisson_model import predict_fixture
            from predictions.recommendation_engine import generate_recommendation
            from predictions.ml.poisson_model import load_models
            
            # Get prediction for this match
            prediction = predict_fixture(
                match.league.code,
                match.home_team.name,
                match.away_team.name,
                elo_scaled=None,  # Use production Elo
                neutral_venue=match.neutral_venue or False
            )
            
            # Get model version
            artifact = load_models()
            model_version = artifact.get('pipeline_version', 'unknown')
            
            # Get recommendation
            recommendation = generate_recommendation(prediction)
            
            # Get market probability from prediction
            market_prob = None
            if market_key == "1X2":
                if selection == "home_win":
                    market_prob = prediction['match_result']['home_win'] / 100.0
                elif selection == "draw":
                    market_prob = prediction['match_result']['draw'] / 100.0
                elif selection == "away_win":
                    market_prob = prediction['match_result']['away_win'] / 100.0
            elif market_key == "BTTS":
                if selection == "btts_yes":
                    market_prob = prediction['btts']['yes'] / 100.0
                elif selection == "btts_no":
                    market_prob = prediction['btts']['no'] / 100.0
            elif market_key.startswith("OVER_UNDER"):
                key = market_key.replace("OVER_UNDER_", "").lower()
                if selection.startswith("over"):
                    market_prob = prediction['over_under'].get(f"over_{key}", 0) / 100.0
                elif selection.startswith("under"):
                    market_prob = prediction['over_under'].get(f"under_{key}", 0) / 100.0
            
            # Create AI snapshot
            TipAISnapshot.objects.create(
                tip=tip,
                model_version=model_version,
                prediction_generated_at=timezone.now(),
                market_key=market_key,
                selection_key=selection,
                raw_probability=market_prob,
                calibrated_probability=None,  # Calibration disabled in production
                recommendation_tier=recommendation.tier if recommendation.status == "STRONG" else None,
                data_quality=recommendation.data_quality,
                confidence_score=recommendation.confidence_score,
                ai_agrees=(
                    recommendation.status == "STRONG" and
                    recommendation.market_key == market_key and
                    recommendation.option_key == selection
                )
            )
            
        except Exception as e:
            # Log error but don't fail tip creation
            logger.warning(f"Failed to capture AI snapshot for tip {tip.id}: {str(e)}")
        
        # Update user tip count
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
    
    def validate(self, attrs):
        """Server-side locking enforcement"""
        # Get the tip instance
        tip = self.instance
        
        # Check if tip is already locked
        if tip and tip.is_locked:
            raise serializers.ValidationError(
                "Cannot update a locked tip. Match has already started."
            )
        
        # Check if match has started
        if 'match' in attrs:
            match = attrs['match']
        elif tip:
            match = tip.match
        else:
            return attrs
        
        if match.kickoff_at and match.kickoff_at < timezone.now():
            raise serializers.ValidationError(
                "Cannot update tip for match that has started"
            )
        
        return attrs


class TipPerformanceSerializer(serializers.ModelSerializer):
    """User tip performance/statistics"""
    
    user = UserMinimalSerializer(read_only=True)
    rank = serializers.SerializerMethodField()
    recent_form_percentage = serializers.SerializerMethodField()
    market_specialization = serializers.SerializerMethodField()
    league_specialization = serializers.SerializerMethodField()
    
    class Meta:
        model = TipPerformance
        fields = [
            'id', 'user', 'rank', 'total_tips', 'correct_tips',
            'incorrect_tips', 'void_tips', 'accuracy_percentage',
            'tips_1x2', 'accuracy_1x2', 'tips_btts', 'accuracy_btts',
            'tips_over_under', 'accuracy_over_under', 'tips_double_chance',
            'accuracy_double_chance', 'tips_dnb', 'accuracy_dnb',
            'tips_epl', 'accuracy_epl', 'tips_laliga', 'accuracy_laliga',
            'tips_seriea', 'accuracy_seriea', 'tips_bundesliga', 'accuracy_bundesliga',
            'tips_ligue1', 'accuracy_ligue1',
            'tipster_score', 'tipster_score_version',
            'current_streak', 'best_streak',
            'recent_form_tips', 'recent_form_correct', 'recent_form_percentage',
            'market_specialization', 'league_specialization',
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
    
    def get_recent_form_percentage(self, obj):
        """Get recent form as percentage"""
        return obj.get_recent_form_percentage()
    
    def get_market_specialization(self, obj):
        """Get market specialization"""
        return obj.get_market_specialization()
    
    def get_league_specialization(self, obj):
        """Get league specialization"""
        return obj.get_league_specialization()


class TipStarSerializer(serializers.ModelSerializer):
    """Public, performance-backed fields for the Tip Stars directory."""

    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TipPerformance
        fields = [
            "id", "user", "total_tips", "correct_tips", "accuracy_percentage",
            "tipster_score", "current_streak", "best_streak", "followers_count",
            "updated_at",
        ]
    
    def get_recent_form_percentage(self, obj):
        """Get recent form as percentage"""
        return obj.get_recent_form_percentage()
    
    def get_market_specialization(self, obj):
        """Get market specialization"""
        return obj.get_market_specialization()
    
    def get_league_specialization(self, obj):
        """Get league specialization"""
        return obj.get_league_specialization()


class TipSlipLegSerializer(serializers.ModelSerializer):
    """Serializer for individual slip leg"""
    
    tip = UserTipListSerializer(read_only=True)
    
    class Meta:
        model = TipSlipLeg
        fields = ['id', 'tip', 'status', 'created_at']
        read_only_fields = ['status']


class TipSlipSerializer(serializers.ModelSerializer):
    """Serializer for tip slips"""
    
    creator = UserMinimalSerializer(read_only=True)
    legs = TipSlipLegSerializer(many=True, read_only=True)
    net_votes = serializers.SerializerMethodField()
    
    class Meta:
        model = TipSlip
        fields = [
            'id', 'creator', 'status', 'total_legs', 'won_legs',
            'lost_legs', 'void_legs', 'net_votes',
            'views_count', 'upvotes_count', 'downvotes_count',
            'comments_count', 'legs', 'created_at', 'updated_at', 'verified_at'
        ]
        read_only_fields = [
            'creator', 'status', 'total_legs', 'won_legs',
            'lost_legs', 'void_legs', 'views_count', 'upvotes_count',
            'downvotes_count', 'comments_count', 'verified_at'
        ]
    
    def get_net_votes(self, obj):
        return obj.net_votes


class CreateTipSlipSerializer(serializers.Serializer):
    """Serializer for creating a new tip slip"""
    
    tip_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=2,
        max_length=10,
        help_text="List of tip IDs to include in the slip (2-10 tips)"
    )
    visibility = serializers.ChoiceField(
        choices=["PUBLIC", "FOLLOWERS", "PRIVATE"],
        default="PUBLIC"
    )
    
    def validate_tip_ids(self, value):
        """Validate tip IDs"""
        # Check all tips exist and belong to the requesting user
        user = self.context['request'].user
        
        tips = UserTip.objects.filter(
            id__in=value,
            user=user
        ).select_related('match')
        
        if tips.count() != len(value):
            raise serializers.ValidationError(
                "One or more tips not found or do not belong to you"
            )
        
        # Check all tips are for different matches
        match_ids = set(tip.match_id for tip in tips)
        if len(match_ids) != len(tips):
            raise serializers.ValidationError(
                "Cannot include multiple tips for the same match in a slip"
            )
        
        # Check all tips are still unlocked
        locked_tips = [tip for tip in tips if tip.is_locked]
        if locked_tips:
            raise serializers.ValidationError(
                f"Cannot include locked tips in a slip ({len(locked_tips)} tips are locked)"
            )
        
        # Check no tip is already in another slip
        tips_in_slips = TipSlipLeg.objects.filter(
            tip__in=value
        ).exists()
        
        if tips_in_slips:
            raise serializers.ValidationError(
                "One or more tips are already in another slip"
            )
        
        return value
    
    def create(self, validated_data):
        """Create slip and legs"""
        user = self.context['request'].user
        tip_ids = validated_data['tip_ids']
        
        # Get tips
        tips = UserTip.objects.filter(
            id__in=tip_ids,
            user=user
        ).select_related('match')
        
        # Create slip
        slip = TipSlip.objects.create(
            creator=user,
            total_legs=len(tips),
            status="PENDING"
        )
        
        # Create legs
        for tip in tips:
            TipSlipLeg.objects.create(
                slip=slip,
                tip=tip,
                status=tip.status
            )
        
        # Invalidate cache
        cache.delete_pattern("tips:slip:*")
        
        return slip