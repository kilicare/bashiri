"""
AI Pick Feed + Result Recap + Accuracy Tracking API Views

Endpoints:
- GET /api/ai-picks/ - List AI picks with filters
- GET /api/ai-results/ - Result recap with date ranges
- GET /api/ai-analytics/ - Accuracy analytics by market/tier/league
"""

from django.utils import timezone
from django.db.models import Sum, Count, Q, F, Case, When, IntegerField
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from datetime import timedelta, datetime
import uuid

from .models import AIPick, Match
from .ai_pick_config import qualify_ai_pick, get_market_label, get_selection_label
from .settlement_engine import settle_ai_pick


class AIPickListView(APIView):
    """
    GET /api/ai-picks/ - List AI picks with filters

    Query params:
    - feed: STANDARD or PREMIUM
    - tier: ELITE, STRONG, MINIMUM
    - status: PENDING, LIVE, WON, LOST, PUSH
    - date: YYYY-MM-DD
    - range: today, yesterday, this_week, last_7_days, this_month
    - league: league code
    - market: market key
    - limit: default 20
    - offset: default 0
    """
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = AIPick.objects.select_related('match', 'match__league')

        # Filter by feed type
        feed_type = request.query_params.get('feed', 'STANDARD')
        if feed_type == 'PREMIUM':
            queryset = queryset.filter(feed='PREMIUM', tier='ELITE')
        else:
            queryset = queryset.filter(feed='STANDARD')

        # Filter by tier
        tier = request.query_params.get('tier')
        if tier:
            queryset = queryset.filter(tier=tier)

        # Filter by status
        status = request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        # Filter by date range
        date_range = request.query_params.get('range')
        if date_range:
            today = timezone.localdate()
            if date_range == 'today':
                queryset = queryset.filter(created_at__date=today)
            elif date_range == 'yesterday':
                yesterday = today - timedelta(days=1)
                queryset = queryset.filter(created_at__date=yesterday)
            elif date_range == 'this_week':
                week_start = today - timedelta(days=today.weekday())
                queryset = queryset.filter(created_at__date__gte=week_start)
            elif date_range == 'last_7_days':
                week_ago = today - timedelta(days=7)
                queryset = queryset.filter(created_at__date__gte=week_ago)
            elif date_range == 'this_month':
                month_start = today.replace(day=1)
                queryset = queryset.filter(created_at__date__gte=month_start)

        # Filter by specific date
        specific_date = request.query_params.get('date')
        if specific_date:
            try:
                date_obj = datetime.strptime(specific_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date=date_obj)
            except ValueError:
                pass

        # Filter by league
        league = request.query_params.get('league')
        if league:
            queryset = queryset.filter(match__league__code=league)

        # Filter by market
        market = request.query_params.get('market')
        if market:
            queryset = queryset.filter(market=market)

        # Ordering: tier (ELITE first), then probability desc, then kickoff
        tier_order = Case(
            When(tier='ELITE', then=0),
            When(tier='STRONG', then=1),
            When(tier='MINIMUM', then=2),
            default=3,
            output_field=IntegerField(),
        )
        queryset = queryset.annotate(tier_priority=tier_order).order_by(
            'tier_priority',
            F('probability').desc(),
            'kickoff_at'
        )

        # Pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        total = queryset.count()
        picks = queryset[offset:offset + limit]

        # Serialize
        results = []
        for pick in picks:
            results.append({
                'pick_id': str(pick.pick_id),
                'match_id': pick.match.id,
                'home_team': pick.home_team,
                'away_team': pick.away_team,
                'league': pick.league,
                'kickoff_at': pick.kickoff_at.isoformat(),
                'market': pick.market,
                'market_label': get_market_label(pick.market),
                'selection': pick.selection,
                'selection_label': get_selection_label(pick.selection),
                'probability': pick.probability,
                'probability_percent': pick.probability_percent,
                'tier': pick.tier,
                'feed': pick.feed,
                'status': pick.status,
                'created_at': pick.created_at.isoformat(),
                'published_at': pick.published_at.isoformat() if pick.published_at else None,
                'settled_at': pick.settled_at.isoformat() if pick.settled_at else None,
                'actual_home_score': pick.actual_home_score,
                'actual_away_score': pick.actual_away_score,
                'result': pick.result,
            })

        return Response({
            'count': total,
            'limit': limit,
            'offset': offset,
            'results': results,
        })


class AIResultRecapView(APIView):
    """
    GET /api/ai-results/ - Result recap with date ranges

    Query params:
    - range: today, yesterday, this_week, last_7_days, this_month, custom
    - start_date: YYYY-MM-DD (for custom range)
    - end_date: YYYY-MM-DD (for custom range)
    - tier: ELITE, STRONG, MINIMUM
    - feed: STANDARD, PREMIUM
    - league: league code
    - market: market key
    """
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = AIPick.objects.select_related('match', 'match__league')

        # Filter by date range
        date_range = request.query_params.get('range', 'today')
        today = timezone.localdate()

        if date_range == 'today':
            queryset = queryset.filter(created_at__date=today)
        elif date_range == 'yesterday':
            yesterday = today - timedelta(days=1)
            queryset = queryset.filter(created_at__date=yesterday)
        elif date_range == 'this_week':
            week_start = today - timedelta(days=today.weekday())
            queryset = queryset.filter(created_at__date__gte=week_start)
        elif date_range == 'last_7_days':
            week_ago = today - timedelta(days=7)
            queryset = queryset.filter(created_at__date__gte=week_ago)
        elif date_range == 'this_month':
            month_start = today.replace(day=1)
            queryset = queryset.filter(created_at__date__gte=month_start)
        elif date_range == 'custom':
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            if start_date:
                try:
                    start_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                    queryset = queryset.filter(created_at__date__gte=start_obj)
                except ValueError:
                    pass
            if end_date:
                try:
                    end_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                    queryset = queryset.filter(created_at__date__lte=end_obj)
                except ValueError:
                    pass

        # Additional filters
        tier = request.query_params.get('tier')
        if tier:
            queryset = queryset.filter(tier=tier)

        feed = request.query_params.get('feed')
        if feed:
            queryset = queryset.filter(feed=feed)

        league = request.query_params.get('league')
        if league:
            queryset = queryset.filter(match__league__code=league)

        market = request.query_params.get('market')
        if market:
            queryset = queryset.filter(market=market)

        # Calculate stats
        total = queryset.count()
        settled = queryset.filter(status__in=['WON', 'LOST', 'PUSH', 'VOID']).count()
        pending = queryset.filter(status='PENDING').count()
        live = queryset.filter(status='LIVE').count()

        won = queryset.filter(status='WON').count()
        lost = queryset.filter(status='LOST').count()
        push = queryset.filter(status='PUSH').count()
        void = queryset.filter(status='VOID').count()

        # Calculate hit rate (wins / (wins + losses))
        decisions = won + lost
        hit_rate = round((won / decisions * 100), 1) if decisions > 0 else 0.0

        # Calculate win rate (wins / settled non-push)
        settled_non_push = won + lost + void
        win_rate = round((won / settled_non_push * 100), 1) if settled_non_push > 0 else 0.0

        # Settlement rate
        settlement_rate = round((settled / total * 100), 1) if total > 0 else 0.0

        return Response({
            'range': date_range,
            'total_picks': total,
            'settled': settled,
            'pending': pending,
            'live': live,
            'won': won,
            'lost': lost,
            'push': push,
            'void': void,
            'hit_rate': hit_rate,
            'win_rate': win_rate,
            'settlement_rate': settlement_rate,
        })


class AIAnalyticsView(APIView):
    """
    GET /api/ai-analytics/ - Accuracy analytics by market, tier, league

    Query params:
    - range: today, yesterday, this_week, last_7_days, this_month
    - breakdown: market, tier, league (default: all)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = AIPick.objects.filter(status__in=['WON', 'LOST', 'PUSH', 'VOID'])

        # Filter by date range
        date_range = request.query_params.get('range', 'this_week')
        today = timezone.localdate()

        if date_range == 'today':
            queryset = queryset.filter(created_at__date=today)
        elif date_range == 'yesterday':
            yesterday = today - timedelta(days=1)
            queryset = queryset.filter(created_at__date=yesterday)
        elif date_range == 'this_week':
            week_start = today - timedelta(days=today.weekday())
            queryset = queryset.filter(created_at__date__gte=week_start)
        elif date_range == 'last_7_days':
            week_ago = today - timedelta(days=7)
            queryset = queryset.filter(created_at__date__gte=week_ago)
        elif date_range == 'this_month':
            month_start = today.replace(day=1)
            queryset = queryset.filter(created_at__date__gte=month_start)

        breakdown = request.query_params.get('breakdown', 'all')

        result = {
            'range': date_range,
            'total_picks': queryset.count(),
        }

        # Market breakdown
        if breakdown in ['all', 'market']:
            market_stats = []
            for market in queryset.values('market').distinct():
                market_key = market['market']
                market_picks = queryset.filter(market=market_key)
                market_total = market_picks.count()
                market_won = market_picks.filter(status='WON').count()
                market_lost = market_picks.filter(status='LOST').count()
                market_hit_rate = round((market_won / (market_won + market_lost) * 100), 1) if (market_won + market_lost) > 0 else 0.0

                market_stats.append({
                    'market': market_key,
                    'market_label': get_market_label(market_key),
                    'picks': market_total,
                    'won': market_won,
                    'lost': market_lost,
                    'hit_rate': market_hit_rate,
                })

            market_stats.sort(key=lambda x: x['hit_rate'], reverse=True)
            result['market_breakdown'] = market_stats

        # Tier breakdown
        if breakdown in ['all', 'tier']:
            tier_stats = []
            for tier in ['ELITE', 'STRONG', 'MINIMUM']:
                tier_picks = queryset.filter(tier=tier)
                tier_total = tier_picks.count()
                tier_won = tier_picks.filter(status='WON').count()
                tier_lost = tier_picks.filter(status='LOST').count()
                tier_hit_rate = round((tier_won / (tier_won + tier_lost) * 100), 1) if (tier_won + tier_lost) > 0 else 0.0

                tier_stats.append({
                    'tier': tier,
                    'picks': tier_total,
                    'won': tier_won,
                    'lost': tier_lost,
                    'hit_rate': tier_hit_rate,
                })

            result['tier_breakdown'] = tier_stats

        # League breakdown
        if breakdown in ['all', 'league']:
            league_stats = []
            for league in queryset.values('match__league__code', 'match__league__name').distinct():
                league_code = league['match__league__code']
                league_name = league['match__league__name']
                league_picks = queryset.filter(match__league__code=league_code)
                league_total = league_picks.count()
                league_won = league_picks.filter(status='WON').count()
                league_lost = league_picks.filter(status='LOST').count()
                league_hit_rate = round((league_won / (league_won + league_lost) * 100), 1) if (league_won + league_lost) > 0 else 0.0

                league_stats.append({
                    'league': league_code,
                    'league_name': league_name,
                    'picks': league_total,
                    'won': league_won,
                    'lost': league_lost,
                    'hit_rate': league_hit_rate,
                })

            league_stats.sort(key=lambda x: x['hit_rate'], reverse=True)
            result['league_breakdown'] = league_stats

        return Response(result)
