from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import LimitOffsetPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, F
from django.core.cache import cache
from django.utils import timezone
import logging

from .models import UserTip, TipPerformance, TipComment, TipVote, TipShare
from .serializers import (
    UserTipSerializer, UserTipListSerializer, CreateTipSerializer,
    UpdateTipSerializer, TipPerformanceSerializer, TipCommentSerializer
)
from .permissions import IsTipOwnerOrReadOnly, CanViewTip
from predictions.models import Match

logger = logging.getLogger(__name__)


class TipListView(APIView):
    """
    GET /tips/ - List public tips with filtering
    POST /tips/ - Create new tip
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """List public tips with advanced filtering"""
        
        # Start with public pending tips
        tips = UserTip.objects.filter(
            visibility="PUBLIC",
            status="PENDING"
        ).select_related('user', 'match').prefetch_related('votes')
        
        # Filtering
        league = request.query_params.get('league')
        market = request.query_params.get('market')
        user = request.query_params.get('user')
        status_filter = request.query_params.get('status', 'PENDING')
        
        if league:
            tips = tips.filter(match__league__code__iexact=league)
        
        if market:
            tips = tips.filter(market_key__iexact=market)
        
        if user:
            tips = tips.filter(user__username__iexact=user)
        
        if status_filter:
            tips = tips.filter(status=status_filter.upper())
        
        # Sorting
        sort = request.query_params.get('sort', '-created_at')
        allowed_sorts = [
            '-created_at', 'created_at',
            '-views_count', 'views_count',
            '-upvotes_count', 'upvotes_count',
            '-confidence', 'confidence'
        ]
        
        if sort in allowed_sorts:
            tips = tips.order_by(sort)
        else:
            tips = tips.order_by('-created_at')
        
        # Pagination
        paginator = LimitOffsetPagination()
        paginator.page_size = request.query_params.get('page_size', 20)
        result = paginator.paginate_queryset(tips, request)
        
        serializer = UserTipListSerializer(
            result, many=True,
            context={'request': request}
        )
        
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        """Create new tip"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Rate limiting - max 5 tips per day
        cache_key = f"tip_creation:{request.user.id}"
        tips_today = cache.get(cache_key, 0)
        
        if tips_today >= 5:
            return Response(
                {'detail': 'Maximum 5 tips per day'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        serializer = CreateTipSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            tip = serializer.save()
            
            # Update rate limit cache
            cache.set(cache_key, tips_today + 1, 86400)  # 24 hours
            
            # Invalidate leaderboard cache
            cache.delete("tips:leaderboard")
            
            return Response(
                UserTipSerializer(tip, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TipDetailView(APIView):
    """
    GET /tips/{id}/ - Get specific tip details
    PUT /tips/{id}/ - Update tip (before match starts)
    DELETE /tips/{id}/ - Delete tip
    """
    permission_classes = [AllowAny]
    
    def get(self, request, tip_id):
        """Get tip details"""
        tip = get_object_or_404(UserTip, pk=tip_id)
        
        # Check visibility permissions
        if tip.visibility == "PRIVATE" and tip.user != request.user:
            return Response(
                {'detail': 'Not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Increment view count
        tip.views_count = F('views_count') + 1
        tip.save(update_fields=['views_count'])
        tip.refresh_from_db()
        
        serializer = UserTipSerializer(tip, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request, tip_id):
        """Update tip"""
        tip = get_object_or_404(UserTip, pk=tip_id)
        
        # Check ownership
        if tip.user != request.user:
            return Response(
                {'detail': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check match hasn't started
        if tip.match.kickoff_at < timezone.now():
            return Response(
                {'detail': 'Cannot update tip for match that has started'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = UpdateTipSerializer(
            tip, data=request.data, partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            cache.delete_pattern("tips:list:*")
            return Response(UserTipSerializer(tip, context={'request': request}).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, tip_id):
        """Delete tip"""
        tip = get_object_or_404(UserTip, pk=tip_id)
        
        # Check ownership or admin
        if tip.user != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tip.delete()
        
        # Update user stats
        request.user.tip_count = max(0, request.user.tip_count - 1)
        request.user.save(update_fields=['tip_count'])
        
        # Invalidate cache
        cache.delete_pattern("tips:list:*")
        cache.delete("tips:leaderboard")
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class TipVoteView(APIView):
    """
    POST /tips/{id}/vote/ - Vote on tip (upvote/downvote)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, tip_id):
        """Vote on tip"""
        tip = get_object_or_404(UserTip, pk=tip_id)
        vote_type = request.data.get('vote')
        
        if vote_type not in ['UP', 'DOWN']:
            return Response(
                {'detail': 'Vote must be UP or DOWN'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create vote
        vote, created = TipVote.objects.get_or_create(
            tip=tip,
            user=request.user,
            defaults={'vote': vote_type}
        )
        
        # If vote exists, update it
        if not created:
            vote.vote = vote_type
            vote.save()
        
        # Update tip vote counts
        tip.upvotes_count = tip.votes.filter(vote='UP').count()
        tip.downvotes_count = tip.votes.filter(vote='DOWN').count()
        tip.save(update_fields=['upvotes_count', 'downvotes_count'])
        
        # Update performance stats
        perf, _ = TipPerformance.objects.get_or_create(user=tip.user)
        perf.total_upvotes_received = TipVote.objects.filter(
            tip__user=tip.user,
            vote='UP'
        ).count()
        perf.save(update_fields=['total_upvotes_received'])
        
        # Invalidate cache
        cache.delete(f"tip:detail:{tip_id}")
        cache.delete("tips:leaderboard")
        
        return Response(
            UserTipSerializer(tip, context={'request': request}).data
        )


class TipCommentView(APIView):
    """
    GET /tips/{id}/comments/ - Get tip comments
    POST /tips/{id}/comments/ - Add comment
    """
    permission_classes = [AllowAny]
    
    def get(self, request, tip_id):
        """Get tip comments"""
        tip = get_object_or_404(UserTip, pk=tip_id)
        
        # Get top-level comments only
        comments = tip.comments.filter(parent__isnull=True).select_related('user')
        serializer = TipCommentSerializer(comments, many=True)
        
        return Response({
            'count': tip.comments_count,
            'results': serializer.data
        })
    
    def post(self, request, tip_id):
        """Add comment to tip"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        tip = get_object_or_404(UserTip, pk=tip_id)
        content = request.data.get('content', '').strip()
        parent_id = request.data.get('parent')
        
        if not content:
            return Response(
                {'detail': 'Comment content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(content) > 500:
            return Response(
                {'detail': 'Comment must be 500 characters or less'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        parent = None
        if parent_id:
            parent = get_object_or_404(TipComment, pk=parent_id, tip=tip)
        
        comment = TipComment.objects.create(
            tip=tip,
            user=request.user,
            content=content,
            parent=parent
        )
        
        # Cache will be updated by comment model save()
        cache.delete(f"tip:detail:{tip_id}")
        
        serializer = TipCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TipLeaderboardView(APIView):
    """
    GET /tips/leaderboard/ - Get tipster rankings
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get top tipsters"""
        # Check cache first
        cache_key = "tips:leaderboard"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        # Get top tipsters (min 10 tips, ordered by accuracy)
        leaderboard = TipPerformance.objects.filter(
            total_tips__gte=10
        ).select_related('user').order_by(
            '-accuracy_percentage', '-total_tips'
        )[:100]
        
        serializer = TipPerformanceSerializer(
            leaderboard, many=True,
            context={'request': request}
        )
        
        # Cache for 5 minutes
        cache.set(cache_key, serializer.data, 300)
        
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })


class UserTipsView(APIView):
    """
    GET /users/{username}/tips/ - Get user's tips
    """
    permission_classes = [AllowAny]
    
    def get(self, request, username):
        """Get tips for specific user"""
        from accounts.models import User
        
        user = get_object_or_404(User, username=username)
        tips = UserTip.objects.filter(user=user).select_related(
            'user', 'match'
        )
        
        # Filter by visibility
        if request.user != user and not request.user.is_staff:
            tips = tips.filter(visibility="PUBLIC")
        
        # Sorting
        sort = request.query_params.get('sort', '-created_at')
        tips = tips.order_by(sort)
        
        # Pagination
        paginator = LimitOffsetPagination()
        result = paginator.paginate_queryset(tips, request)
        
        serializer = UserTipListSerializer(result, many=True)
        return paginator.get_paginated_response(serializer.data)


class TipShareView(APIView):
    """
    POST /tips/{id}/share/ - Track tip shares
    """
    permission_classes = [AllowAny]
    
    def post(self, request, tip_id):
        """Track tip share"""
        tip = get_object_or_404(UserTip, pk=tip_id)
        shared_to = request.data.get('shared_to', '').upper()
        
        if shared_to not in ['WHATSAPP', 'TWITTER', 'FACEBOOK', 'COPY', 'SMS']:
            return Response(
                {'detail': 'Invalid share platform'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        TipShare.objects.create(
            tip=tip,
            user=request.user if request.user.is_authenticated else None,
            shared_to=shared_to
        )
        
        return Response({
            'message': 'Share tracked successfully',
            'shared_to': shared_to
        })