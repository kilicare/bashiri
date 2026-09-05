from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, F, Case, When
from django.db import models
from django.core.cache import cache
from django.utils import timezone
from asgiref.sync import async_to_sync
import logging

from .models import UserTip, TipPerformance, TipComment, TipVote, TipShare, TipSlip
from .serializers import (
    UserTipSerializer, UserTipListSerializer, CreateTipSerializer,
    UpdateTipSerializer, TipPerformanceSerializer, TipCommentSerializer,
    TipSlipSerializer, CreateTipSlipSerializer, TipStarSerializer
)
from .permissions import IsTipOwnerOrReadOnly, CanViewTip
from .cache import TipsCache
from .market_registry import get_available_markets, get_markets_by_category
from predictions.models import Match
from accounts.models import User

logger = logging.getLogger(__name__)


class TipListView(APIView):
    """
    GET /tips/ - List public tips with filtering
    POST /tips/ - Create new tip
    """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]
    throttle_scope = 'tips'
    
    def get(self, request):
        """List public tips with caching"""

        # Build filter dict
        filters = {
            'league': request.query_params.get('league'),
            'market': request.query_params.get('market'),
            'user': request.query_params.get('user'),
            'following': request.query_params.get('following'),  # Filter by followed users
            'status': request.query_params.get('status', 'PENDING'),
            'sort': request.query_params.get('sort', '-created_at'),
            'page_size': request.query_params.get('page_size', 20),
        }

        # Try to get from cache
        cached_data = TipsCache.get_cached_tips_list(filters)
        if cached_data:
            return Response(cached_data)

        # Query if not cached with optimized selects
        tips = UserTip.objects.filter(
            visibility="PUBLIC",
            status="PENDING",
            is_active=True  # Only show active tips in main feed
        ).select_related('user', 'match', 'user__tip_performance').prefetch_related('ai_snapshot')

        # Apply filters
        if filters['league']:
            tips = tips.filter(match__league__code__iexact=filters['league'])
        if filters['market']:
            tips = tips.filter(market_key__iexact=filters['market'])
        if filters['user']:
            tips = tips.filter(user__username__iexact=filters['user'])
        
        # Filter by followed users (only for authenticated users)
        if filters['following'] and request.user.is_authenticated:
            followed_user_ids = request.user.following.values_list('id', flat=True)
            tips = tips.filter(user_id__in=followed_user_ids)

        # Sort - Enhanced discovery ranking
        sort = filters['sort']
        allowed_sorts = [
            '-created_at', 'created_at',
            '-views_count', 'views_count',
            '-upvotes_count', 'upvotes_count',
            '-confidence', 'confidence',
            'engagement', '-engagement',  # Composite engagement score
            'ai_agrees', '-ai_agrees',  # AI-aligned tips
            'recent_form', '-recent_form',  # Hot form tipsters
        ]

        if sort == 'engagement':
            # Sort by composite engagement score (weighted: upvotes*5 + views + comments*3)
            tips = tips.order_by('-upvotes_count', '-views_count', '-comments_count', '-created_at')
        elif sort == '-engagement':
            tips = tips.order_by('upvotes_count', 'views_count', 'comments_count', 'created_at')
        elif sort == 'ai_agrees':
            # Sort by AI agreement (tips where AI agrees first)
            tips = tips.filter(ai_snapshot__ai_agrees=True).order_by('-created_at')
        elif sort == '-ai_agrees':
            tips = tips.filter(ai_snapshot__ai_agrees=False).order_by('-created_at')
        elif sort == 'recent_form':
            # Sort by tipster's recent form (hot form tipsters first)
            tips = tips.select_related('user__tip_performance').order_by(
                '-user__tip_performance__recent_form_correct',
                '-user__tip_performance__current_streak',
                '-created_at'
            )
        elif sort == '-recent_form':
            tips = tips.select_related('user__tip_performance').order_by(
                'user__tip_performance__recent_form_correct',
                'user__tip_performance__current_streak',
                '-created_at'
            )
        elif sort in allowed_sorts:
            tips = tips.order_by(sort)
        else:
            tips = tips.order_by('-created_at')

        # Pagination
        paginator = LimitOffsetPagination()
        paginator.page_size = filters['page_size']
        result = paginator.paginate_queryset(tips, request)

        serializer = UserTipListSerializer(
            result, many=True,
            context={'request': request}
        )
        response_data = paginator.get_paginated_response(serializer.data)

        # Cache the response
        TipsCache.cache_tips_list(filters, response_data.data)

        return response_data
    
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
            TipsCache.invalidate_leaderboard()
            
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
    permission_classes = [AllowAny]  # Visibility checked in GET, ownership in PUT/DELETE
    
    def get(self, request, tip_id):
        """Get tip details with caching"""
        # Try to get from cache
        cached_data = TipsCache.get_cached_tip_detail(tip_id)
        if cached_data:
            return Response(cached_data)

        tip = get_object_or_404(UserTip, pk=tip_id)

        # Check visibility permissions
        if tip.visibility == "PRIVATE" and tip.user != request.user:
            return Response(
                {'detail': 'Not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check followers-only visibility
        if tip.visibility == "FOLLOWERS" and tip.user != request.user:
            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            # Check if user follows tipster
            if not tip.user.followers.filter(id=request.user.id).exists():
                return Response(
                    {'detail': 'Not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Increment view count (async, no refresh needed)
        UserTip.objects.filter(pk=tip_id).update(
            views_count=F('views_count') + 1
        )
        tip.views_count += 1  # Increment locally for response

        serializer = UserTipSerializer(tip, context={'request': request})
        response_data = serializer.data

        # Cache the response
        TipsCache.cache_tip_detail(tip_id, response_data)

        return Response(response_data)
    
    def put(self, request, tip_id):
        """Update tip"""
        tip = get_object_or_404(UserTip, pk=tip_id)
        
        # Check ownership
        if tip.user != request.user:
            return Response(
                {'detail': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Server-side locking enforcement
        if tip.is_locked:
            return Response(
                {'detail': 'Cannot update a locked tip. Match has already started.'},
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
        TipsCache.invalidate_tips_lists()
        TipsCache.invalidate_leaderboard()
        
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

        # ⭐ BROADCAST VOTE UPDATE via WebSocket
        from tips.consumers import broadcast_tip_voted
        from asgiref.sync import async_to_sync

        async_to_sync(broadcast_tip_voted)(
            tip.id,
            tip.upvotes_count,
            tip.downvotes_count
        )

        # Update performance stats
        perf, _ = TipPerformance.objects.get_or_create(user=tip.user)
        perf.total_upvotes_received = TipVote.objects.filter(
            tip__user=tip.user,
            vote='UP'
        ).count()
        perf.save(update_fields=['total_upvotes_received'])
        
        # Invalidate cache
        TipsCache.invalidate_tip_detail(tip_id)
        TipsCache.invalidate_leaderboard()
        
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
        TipsCache.invalidate_tip_detail(tip_id)
        
        serializer = TipCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LeaderboardView(APIView):
    """
    GET /tips/leaderboard/ - Get tipster rankings
    
    Query params:
    - period: 'all', 'week', 'month' (default: 'all')
    - market: 'all', '1x2', 'btts', 'goals', 'double_chance', 'dnb' (default: 'all')
    - min_tips: minimum tip count (default: 10)
    - limit: number of results (default: 50)
    """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]
    throttle_scope = 'tips'
    
    def get(self, request):
        """Get top tipsters with professional ranking logic"""
        period = request.query_params.get('period', 'all')
        market = request.query_params.get('market', 'all')
        min_tips = int(request.query_params.get('min_tips', 5))
        limit = int(request.query_params.get('limit', 50))
        
        # Calculate date range for period filtering
        from datetime import timedelta
        now = timezone.now()
        
        if period == 'week':
            date_from = now - timedelta(days=7)
        elif period == 'month':
            date_from = now - timedelta(days=30)
        else:
            date_from = None
        
        # Market field mapping
        market_field_map = {
            '1x2': 'tips_1x2',
            'btts': 'tips_btts',
            'goals': 'tips_over_under',
            'double_chance': 'tips_double_chance',
            'dnb': 'tips_dnb',
        }
        
        # Accuracy field mapping
        accuracy_field_map = {
            '1x2': 'accuracy_1x2',
            'btts': 'accuracy_btts',
            'goals': 'accuracy_over_under',
            'double_chance': 'accuracy_double_chance',
            'dnb': 'accuracy_dnb',
        }
        
        # For period-specific filtering, we need to calculate from UserTip
        if period in ['week', 'month']:
            # Get users with tips in the period
            users_with_tips = UserTip.objects.filter(
                created_at__gte=date_from,
                status__in=['CORRECT', 'INCORRECT']
            ).values('user').annotate(
                total_tips=Count('id'),
                correct_tips=Count('id', filter=Q(status='CORRECT'))
            ).filter(total_tips__gte=min_tips)
            
            user_ids = [u['user'] for u in users_with_tips]
            
            # Calculate period-specific stats for each user
            tipster_stats = []
            for user_id in user_ids:
                tips = UserTip.objects.filter(
                    user_id=user_id,
                    created_at__gte=date_from,
                    status__in=['CORRECT', 'INCORRECT']
                )
                
                total = tips.count()
                correct = tips.filter(status='CORRECT').count()
                accuracy = (correct / total * 100) if total > 0 else 0
                
                # Calculate current streak (consecutive correct tips ending today)
                recent_tips = tips.order_by('-created_at')
                current_streak = 0
                for tip in recent_tips:
                    if tip.status == 'CORRECT':
                        current_streak += 1
                    else:
                        break
                
                # Calculate best streak
                best_streak = 0
                temp_streak = 0
                for tip in tips.order_by('created_at'):
                    if tip.status == 'CORRECT':
                        temp_streak += 1
                        best_streak = max(best_streak, temp_streak)
                    else:
                        temp_streak = 0
                
                # Composite score calculation
                tips_score = (
                    100 if total >= 100 else
                    80 if total >= 50 else
                    60 if total >= 20 else
                    40 if total >= 10 else
                    20
                )
                
                streak_score = (
                    100 if current_streak >= 10 else
                    80 if current_streak >= 5 else
                    60 if current_streak >= 3 else
                    40 if current_streak >= 1 else
                    0
                )
                
                composite_score = (accuracy * 0.6) + (tips_score * 0.2) + (streak_score * 0.2)
                
                tipster_stats.append({
                    'user_id': user_id,
                    'total_tips': total,
                    'correct_tips': correct,
                    'accuracy_percentage': accuracy,
                    'current_streak': current_streak,
                    'best_streak': best_streak,
                    'composite_score': composite_score
                })
            
            # Sort by composite score, then accuracy, then tips count
            tipster_stats.sort(key=lambda x: (-x['composite_score'], -x['accuracy_percentage'], -x['total_tips']))
            
            # Get user details and create results
            from accounts.models import User
            ranked_results = []
            for idx, stats in enumerate(tipster_stats[:limit], 1):
                user = User.objects.get(id=stats['user_id'])
                ranked_results.append({
                    'rank': idx,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'avatar_url': user.avatar_url if hasattr(user, 'avatar_url') else None,
                        'tipster_score': stats.get('composite_score', 0),
                        'verified_tipster': getattr(user, 'verified_tipster', False)
                    },
                    'total_tips': stats['total_tips'],
                    'accuracy_percentage': stats['accuracy_percentage'],
                    'current_streak': stats['current_streak'],
                    'best_streak': stats['best_streak'],
                    'recent_form_correct': stats['correct_tips'],
                    'recent_form_tips': stats['total_tips']
                })
            
            response_data = {
                'count': len(ranked_results),
                'period': period,
                'market': market,
                'min_tips': min_tips,
                'results': ranked_results
            }
            
            TipsCache.cache_leaderboard(response_data)
            return Response(response_data)
        
        # For "all" period, use TipPerformance model
        queryset = TipPerformance.objects.select_related('user').annotate(
            # Composite score: accuracy (60%) + tips_count (20%) + streak (20%)
            composite_score=(
                F('accuracy_percentage') * 0.6 +
                Case(
                    When(total_tips__gte=100, then=100),
                    When(total_tips__gte=50, then=80),
                    When(total_tips__gte=20, then=60),
                    When(total_tips__gte=10, then=40),
                    default=20,
                    output_field=models.FloatField()
                ) * 0.2 +
                Case(
                    When(current_streak__gte=10, then=100),
                    When(current_streak__gte=5, then=80),
                    When(current_streak__gte=3, then=60),
                    When(current_streak__gte=1, then=40),
                    default=0,
                    output_field=models.FloatField()
                ) * 0.2
            )
        )
        
        # Apply minimum tip filter
        if market == 'all':
            queryset = queryset.filter(total_tips__gte=min_tips)
        else:
            # Market-specific minimum tips
            market_field = market_field_map.get(market, 'total_tips')
            queryset = queryset.filter(**{f'{market_field}__gte': min_tips})
        
        # Ordering by composite score, then accuracy, then tips count
        if market == 'all':
            order_by = ['-composite_score', '-accuracy_percentage', '-total_tips']
        else:
            market_accuracy_field = accuracy_field_map.get(market, 'accuracy_percentage')
            market_tips_field = market_field_map.get(market, 'total_tips')
            order_by = [f'-{market_accuracy_field}', f'-{market_tips_field}', '-current_streak']
        
        leaderboard = queryset.order_by(*order_by)[:limit]
        
        serializer = TipPerformanceSerializer(
            leaderboard, many=True,
            context={'request': request}
        )
        
        # Add rank to each result
        ranked_results = []
        for idx, tipster in enumerate(serializer.data, 1):
            tipster['rank'] = idx
            ranked_results.append(tipster)
        
        response_data = {
            'count': len(ranked_results),
            'period': period,
            'market': market,
            'min_tips': min_tips,
            'results': ranked_results
        }
        
        # Cache the response
        TipsCache.cache_leaderboard(response_data)
        
        return Response(response_data)


class TipStarsView(APIView):
    """GET /tips/tip-stars/ - reliable public tipster directory."""

    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]
    throttle_scope = "tips"

    def get(self, request):
        limit = min(max(int(request.query_params.get("limit", 20)), 1), 50)
        offset = max(int(request.query_params.get("offset", 0)), 0)
        verified_only = request.query_params.get("verified") == "true"

        performances = TipPerformance.objects.filter(
            total_tips__gte=10,
            tipster_score__gt=0,
            user__is_active=True,
        ).select_related("user")
        if verified_only:
            performances = performances.filter(user__verified_tipster=True)

        total = performances.count()
        results = performances.order_by(
            "-tipster_score",
            "-accuracy_percentage",
            "-total_tips",
            "-user__verified_tipster",
            "user__username",
        )[offset:offset + limit]

        return Response({
            "count": total,
            "next": offset + limit if offset + limit < total else None,
            "previous": max(offset - limit, 0) if offset else None,
            "results": TipStarSerializer(results, many=True).data,
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
            'user', 'match', 'user__tip_performance'
        ).prefetch_related('ai_snapshot')
        
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


class BestStreakUserView(APIView):
    """
    GET /tips/best-streak-user/ - Get user with best streak for today
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Get user with best streak for today"""
        # Cache for 1 hour
        cache_key = "best_streak_user_today"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        today = timezone.localdate()

        # Get tip performance with highest best_streak from users who have tips today
        best_streak_user = TipPerformance.objects.filter(
            user__tips__created_at__date=today
        ).order_by('-best_streak').first()

        if not best_streak_user:
            return Response({
                'user': None,
                'best_streak': 0,
                'total_tips': 0,
                'accuracy': 0
            })

        user_data = {
            'user': {
                'id': best_streak_user.user.id,
                'username': best_streak_user.user.username,
                'avatar_url': best_streak_user.user.avatar_url,
                'verified_tipster': best_streak_user.user.verified_tipster,
            },
            'best_streak': best_streak_user.best_streak,
            'total_tips': best_streak_user.total_tips,
            'accuracy': best_streak_user.accuracy_percentage,
            'current_streak': best_streak_user.current_streak,
        }

        # Cache for 1 hour
        cache.set(cache_key, user_data, 3600)

        return Response(user_data)


class TipSlipListView(APIView):
    """
    GET /tips/slips/ - List user's slips
    POST /tips/slips/ - Create new slip
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List user's slips"""
        slips = TipSlip.objects.filter(
            creator=request.user
        ).select_related('creator').prefetch_related('legs__tip')
        
        serializer = TipSlipSerializer(slips, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create new slip"""
        serializer = CreateTipSlipSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            slip = serializer.save()
            return Response(
                TipSlipSerializer(slip).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TipSlipDetailView(APIView):
    """
    GET /tips/slips/{id}/ - Get slip details
    DELETE /tips/slips/{id}/ - Delete slip
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, slip_id):
        """Get slip details"""
        slip = get_object_or_404(TipSlip, pk=slip_id)
        
        # Check ownership
        if slip.creator != request.user:
            return Response(
                {'detail': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TipSlipSerializer(slip)
        return Response(serializer.data)
    
    def delete(self, request, slip_id):
        """Delete slip"""
        slip = get_object_or_404(TipSlip, pk=slip_id)
        
        # Check ownership
        if slip.creator != request.user:
            return Response(
                {'detail': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Can only delete pending slips
        if slip.status != "PENDING":
            return Response(
                {'detail': 'Cannot delete a slip that has already been verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        slip.delete()
        
        # Invalidate cache
        cache.delete_pattern("tips:slip:*")
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarketRegistryView(APIView):
    """
    GET /tips/markets/ - Get available market definitions
    
    This endpoint provides the canonical market registry to the frontend.
    Frontend should consume this API rather than hardcoding market options.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get all available market definitions"""
        category = request.query_params.get('category')
        
        if category:
            # Get markets by category
            markets = get_markets_by_category(category)
        else:
            # Get all available markets
            markets = get_available_markets()
        
        # Format for API response
        response_data = {
            'markets': [
                {
                    'key': market['key'],
                    'label': market['label'],
                    'category': market['category'].value,
                    'selections': market['selections'],
                    'available': market['available'],
                    'requires_final_score': market['requires_final_score'],
                    'supports_draw_void': market['supports_draw_void'],
                }
                for market in markets
            ],
            'categories': ['result', 'goals', 'both_teams', 'correct_score']
        }
        
        return Response(response_data)