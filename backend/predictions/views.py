"""
predictions/views.py
"""
from django.db.models import Q, Sum, Max
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle

from core.cache_utils import cache_response

from .models import ActiveDerby, Match, OddsBookmaker, SavedMatch, SavedMarket, Team, League, TeamStanding, HeadToHead
from .serializers import ActiveDerbySerializer, MatchListSerializer, OddsBookmakerSerializer, SavedMatchSerializer, SavedMarketSerializer, TeamSerializer, LeagueSerializer, TeamStandingSerializer, HeadToHeadSerializer
from .services import UnknownTeamError, build_prediction_dashboard, build_match_analysis, head_to_head, team_form, build_enhanced_prediction_dashboard, get_enhanced_team_data, get_enhanced_h2h_data


class NoThrottle(AnonRateThrottle):
    rate = '10000/hour'  # effectively unlimited for search endpoints


class SyncHistoricalView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = []  # No throttling for sync

    def post(self, request):
        from django.core.management import call_command
        from io import StringIO
        import sys
        
        seasons = request.data.get('seasons', [])
        if not seasons:
            return Response({'error': 'No seasons provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert seasons to list of strings for command with --seasons flag
        seasons_args = ['--seasons'] + [str(s) for s in seasons]
        
        # Capture output
        output = StringIO()
        try:
            call_command('sync_historical', *seasons_args, stdout=output, stderr=output)
            output_str = output.getvalue()
            return Response({'status': 'success', 'output': output_str})
        except Exception as e:
            return Response({'status': 'error', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FixturesView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for fixtures

    def get(self, request):
        from django.core.cache import cache
        from datetime import datetime, timedelta

        # Get date parameter (format: YYYY-MM-DD)
        date_str = request.query_params.get("date")
        
        # Get range filter (today, tomorrow, this_week, next_week, this_month)
        range_filter = request.query_params.get("range", "this_week")
        
        # Get league filter
        league_filter = request.query_params.get("league")
        
        # Get pagination parameters
        offset = int(request.query_params.get("offset", 0))
        limit = int(request.query_params.get("limit", 50))
        
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                # Get all matches for the specific date (start of day to end of day)
                start_of_day = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
                end_of_day = timezone.make_aware(datetime.combine(target_date, datetime.max.time()))
                
                cache_key = f"fixtures_list_{date_str}_{offset}_{limit}"
                cached_data = cache.get(cache_key)
                
                if cached_data is not None:
                    return Response(cached_data)
                
                matches = (
                    Match.objects.filter(
                        kickoff_at__gte=start_of_day,
                        kickoff_at__lte=end_of_day
                    )
                    .select_related("league", "home_team", "away_team")
                    .order_by("kickoff_at")[offset:offset + limit]
                )
                data = MatchListSerializer(matches, many=True).data
                cache.set(cache_key, data, timeout=300)  # 5 minutes cache for specific date
                
                return Response(data)
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD"}, status=400)
        
        # Calculate date range based on filter
        now = timezone.now()
        start_date = None
        end_date = None
        
        if range_filter == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif range_filter == "tomorrow":
            tomorrow = now + timedelta(days=1)
            start_date = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = tomorrow.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif range_filter == "this_week":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now + timedelta(days=7)
        elif range_filter == "next_week":
            start_date = (now + timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = (now + timedelta(days=14)).replace(hour=23, minute=59, second=59, microsecond=999999)
        elif range_filter == "this_month":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now + timedelta(days=30)
        else:  # Default to this_week
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now + timedelta(days=7)
        
        cache_key = f"fixtures_list_{range_filter}_{league_filter or 'all'}_{offset}_{limit}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        # Build query with optional league filter
        query = Match.objects.filter(
            status="SCHEDULED",
            kickoff_at__gte=start_date,
            kickoff_at__lte=end_date
        )
        
        if league_filter:
            query = query.filter(league__poisson_key=league_filter)
        
        matches = (
            query
            .select_related("league", "home_team", "away_team")
            .order_by("kickoff_at")[offset:offset + limit]
        )
        data = MatchListSerializer(matches, many=True).data
        cache.set(cache_key, data, timeout=120)  # 2 minutes cache
        
        return Response(data)


class LiveMatchesView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for live matches

    def get(self, request):
        from django.core.cache import cache

        # Cache live matches for 60 seconds (syncs every 1 minute via Celery)
        cache_key = "live_matches"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        matches = Match.objects.filter(status="LIVE").select_related(
            "league", "home_team", "away_team"
        ).order_by("kickoff_at")
        data = MatchListSerializer(matches, many=True).data
        cache.set(cache_key, data, timeout=60)  # 60 seconds cache (1 minute)
        
        return Response(data)


class FinishedMatchesView(APIView):
    """GET /finished/ — mechi zilizoisha (kama Sofascore)"""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for finished matches

    def get(self, request):
        from django.core.cache import cache
        from datetime import datetime

        # Get query params for pagination and filtering
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        league_code = request.query_params.get("league", None)
        team_name = request.query_params.get("team", None)
        date_str = request.query_params.get("date", None)

        # Cache key based on filters (shorter cache for filtered queries)
        cache_key = f"finished_matches_{limit}_{offset}_{league_code or 'all'}_{team_name or 'all'}_{date_str or 'all'}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        # Base query for finished matches
        matches = Match.objects.filter(status="FINISHED").select_related(
            "league", "home_team", "away_team"
        )

        # Filter by date if provided
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                start_of_day = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
                end_of_day = timezone.make_aware(datetime.combine(target_date, datetime.max.time()))
                matches = matches.filter(kickoff_at__gte=start_of_day, kickoff_at__lte=end_of_day)
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD"}, status=400)

        # Filter by league if provided
        if league_code:
            matches = matches.filter(league__code=league_code)

        # Filter by team if provided
        if team_name:
            matches = matches.filter(
                Q(home_team__name__icontains=team_name) | Q(away_team__name__icontains=team_name)
            )

        # Order by most recent first
        matches = matches.order_by("-kickoff_at")

        # Apply pagination
        total = matches.count()
        matches = matches[offset:offset + limit]

        data = {
            "count": total,
            "results": MatchListSerializer(matches, many=True).data
        }
        cache.set(cache_key, data, timeout=60)  # 1 minute cache
        
        return Response(data)


class MatchOverviewView(APIView):
    """GET /matches/{id}/overview/ — Hatua 2 ya Create Prediction: H2H + form, BILA masoko bado."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for match overview

    def get(self, request, match_id):
        from django.core.cache import cache

        # Get range parameters from query string (default to 5)
        form_range = int(request.query_params.get("form_range", 5))
        h2h_range = int(request.query_params.get("h2h_range", 5))

        # Cache overview for 2 minutes (match data changes infrequently)
        cache_key = f"match_overview_{match_id}_{form_range}_{h2h_range}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        match = get_object_or_404(
            Match.objects.select_related("league", "home_team", "away_team"), pk=match_id
        )
        
        # Get enhanced team data and H2H
        home_data = get_enhanced_team_data(match.home_team_id, match.league_id)
        away_data = get_enhanced_team_data(match.away_team_id, match.league_id)
        h2h_data = get_enhanced_h2h_data(match.home_team_id, match.away_team_id, match.league_id)
        
        data = {
            "match": MatchListSerializer(match).data,
            "home_form": team_form(match.home_team_id, exclude_match_id=match.id, n=form_range),
            "away_form": team_form(match.away_team_id, exclude_match_id=match.id, n=form_range),
            "head_to_head": head_to_head(match.home_team_id, match.away_team_id, n=h2h_range),
            "home_team_context": home_data,
            "away_team_context": away_data,
            "enhanced_h2h": h2h_data,
        }
        cache.set(cache_key, data, timeout=120)  # 2 minutes cache
        
        return Response(data)


class MatchDashboardView(APIView):
    """GET /matches/{id}/dashboard/ — Hatua 3, CORE FEATURE with enhanced data."""
    permission_classes = [AllowAny]

    def get(self, request, match_id):
        match = get_object_or_404(
            Match.objects.select_related("league", "home_team", "away_team"), pk=match_id
        )
        user = request.user
        is_subscriber = bool(user and user.is_authenticated and getattr(user, "is_subscription_active", False))

        try:
            dashboard = build_enhanced_prediction_dashboard(match, is_subscriber)
        except UnknownTeamError:
            return Response(
                {"detail": "AI Prediction bado haipatikani kwa mechi hii — timu haina data ya kutosha."},
                status=status.HTTP_404_NOT_FOUND,
            )

        dashboard["match"] = MatchListSerializer(match).data
        return Response(dashboard)


class SearchView(APIView):
    """GET /search/?q=...&date=YYYY-MM-DD — tafuta mechi kwa jina la timu, optionally by date."""
    permission_classes = [AllowAny]

    def get(self, request):
        from datetime import datetime

        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response({"results": []})

        date_str = request.query_params.get("date", None)
        league_code = request.query_params.get("league", None)

        matches = Match.objects.filter(
            Q(home_team__name__icontains=query) | Q(away_team__name__icontains=query)
        ).select_related("league", "home_team", "away_team")

        # Filter by date if provided
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                start_of_day = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
                end_of_day = timezone.make_aware(datetime.combine(target_date, datetime.max.time()))
                matches = matches.filter(kickoff_at__gte=start_of_day, kickoff_at__lte=end_of_day)
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD"}, status=400)

        # Filter by league if provided
        if league_code:
            matches = matches.filter(league__code=league_code)

        matches = matches.order_by("-kickoff_at")[:20]

        return Response({"results": MatchListSerializer(matches, many=True).data})


class SaveMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        match = get_object_or_404(Match, pk=request.data.get("match_id"))
        saved, created = SavedMatch.objects.get_or_create(user=request.user, match=match)
        return Response(
            SavedMatchSerializer(saved).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        SavedMatch.objects.filter(user=request.user, match_id=request.data.get("match_id")).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedMatchesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved = SavedMatch.objects.filter(user=request.user).select_related(
            "match", "match__league", "match__home_team", "match__away_team"
        ).order_by("-created_at")
        return Response(SavedMatchSerializer(saved, many=True).data)


class SaveMarketView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        match = get_object_or_404(Match, pk=request.data.get("match_id"))
        market_key = request.data.get("market_key")
        if not market_key:
            return Response({"detail": "market_key is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        saved, created = SavedMarket.objects.get_or_create(
            user=request.user, 
            match=match, 
            market_key=market_key
        )
        return Response(
            SavedMarketSerializer(saved).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        SavedMarket.objects.filter(
            user=request.user, 
            match_id=request.data.get("match_id"),
            market_key=request.data.get("market_key")
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedMarketsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        match_id = request.query_params.get("match_id")
        queryset = SavedMarket.objects.filter(user=request.user).select_related(
            "match", "match__league", "match__home_team", "match__away_team"
        )
        
        if match_id:
            queryset = queryset.filter(match_id=match_id)
            
        saved = queryset.order_by("-created_at")
        data = SavedMarketSerializer(saved, many=True).data
        
        # Add AI pick data for each saved market
        from .services import get_ai_recommended_option
        
        for item in data:
            try:
                match = Match.objects.get(id=item['match']['id'])
                ai_option = get_ai_recommended_option(match, item['market_key'])
                if ai_option:
                    # Get the prediction to get confidence
                    from .ml.poisson_model import predict_fixture
                    prediction = predict_fixture(match.league.poisson_key, match.home_team.name, match.away_team.name)
                    
                    # Get market definition
                    from .services import MARKET_DEFINITIONS
                    market_def = MARKET_DEFINITIONS.get(item['market_key'], {})
                    source_data = prediction.get(market_def.get('source_key', ''), {})
                    
                    # Special handling for CORRECT_SCORE
                    if item['market_key'] == 'CORRECT_SCORE':
                        # ai_option is the score key (e.g., "2-0")
                        option_label = ai_option  # Use the score as the label
                        # Get probability from predictions list
                        predictions = source_data.get('predictions', [])
                        pred_data = next((p for p in predictions if p['score'] == ai_option), None)
                        confidence = round(pred_data['probability_percent'], 1) if pred_data else None
                    else:
                        # Standard market handling
                        option_def = next((opt for opt in market_def.get('options', []) if opt['key'] == ai_option), None)
                        option_label = option_def['label'] if option_def else ai_option
                        
                        # Get confidence - check if it's already a percentage or probability
                        raw_value = source_data.get(ai_option, 0) if source_data else 0
                        if raw_value > 1:
                            # Already a percentage (0-100), don't multiply
                            confidence = round(raw_value, 1)
                        else:
                            # Probability (0-1), convert to percentage
                            confidence = round(raw_value * 100, 1)
                    
                    # Ensure confidence is reasonable (0-100)
                    if confidence is not None and (confidence < 0 or confidence > 100):
                        confidence = None
                    
                    item['ai_pick'] = option_label
                    item['ai_confidence'] = confidence
            except Exception:
                # If we can't get AI data, just leave fields empty
                item['ai_pick'] = None
                item['ai_confidence'] = None
        
        return Response(data)


class GenerateSavedMarketsPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .pdf_service import generate_saved_markets_pdf
        
        tab_name = request.data.get("tab_name", "All Markets")
        
        # Filter markets based on tab
        queryset = SavedMarket.objects.filter(user=request.user).select_related(
            "match", "match__league", "match__home_team", "match__away_team"
        )
        
        # Apply tab filtering
        if tab_name == "over_under":
            queryset = queryset.filter(market_key__contains='OVER_UNDER')
        elif tab_name == "match_result":
            queryset = queryset.filter(market_key__in=['1X2', 'DOUBLE_CHANCE', 'DRAW_NO_BET'])
        elif tab_name == "btts":
            queryset = queryset.filter(market_key='BTTS')
        
        saved = queryset.order_by("-created_at")
        data = SavedMarketSerializer(saved, many=True).data
        
        # Add AI pick data
        from .services import get_ai_recommended_option
        
        for item in data:
            try:
                match = Match.objects.get(id=item['match']['id'])
                ai_option = get_ai_recommended_option(match, item['market_key'])
                if ai_option:
                    from .ml.poisson_model import predict_fixture
                    prediction = predict_fixture(match.league.poisson_key, match.home_team.name, match.away_team.name)
                    
                    from .services import MARKET_DEFINITIONS
                    market_def = MARKET_DEFINITIONS.get(item['market_key'], {})
                    source_data = prediction.get(market_def.get('source_key', ''), {})
                    
                    option_def = next((opt for opt in market_def.get('options', []) if opt['key'] == ai_option), None)
                    option_label = option_def['label'] if option_def else ai_option
                    
                    raw_value = source_data.get(ai_option, 0) if source_data else 0
                    if raw_value > 1:
                        confidence = round(raw_value, 1)
                    else:
                        confidence = round(raw_value * 100, 1)
                    
                    if confidence is not None and (confidence < 0 or confidence > 100):
                        confidence = None
                    
                    item['ai_pick'] = option_label
                    item['ai_confidence'] = confidence
            except Exception:
                item['ai_pick'] = None
                item['ai_confidence'] = None
        
        # Generate PDF
        pdf_buffer = generate_saved_markets_pdf(data, tab_name)
        
        # Return PDF as response
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="bashiri_saved_markets_{tab_name.lower().replace(" ", "_")}.pdf"'
        return response


class LeagueListView(APIView):
    """GET /api/predictions/leagues/ — kwa Settings/leagues page."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for static league data

    @cache_response("leagues", timeout=3600)  # saa 1 — ligi hazibadiliki mara kwa mara
    def get(self, request):
        from .models import League
        from .serializers import LeagueSerializer
        from .ml.poisson_model import get_available_leagues

        # Get leagues from database that are active
        db_leagues = League.objects.filter(is_active=True)
        db_league_data = LeagueSerializer(db_leagues, many=True).data
        
        # Get available leagues from ML model JSON for validation
        ml_leagues = get_available_leagues()
        
        # Filter to only include leagues that exist in both DB and ML model
        # This ensures frontend only shows leagues that have working prediction models
        valid_leagues = [league for league in db_league_data if league['poisson_key'] in ml_leagues]
        
        return Response(valid_leagues)


class TeamListView(APIView):
    """GET /api/predictions/teams/?league=EPL — kwa Settings/teams page."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for static team data

    @cache_response("teams", timeout=3600)  # saa 1 — timu hazibadiliki mara kwa mara
    def get(self, request):
        from .models import Team
        from .serializers import TeamSerializer

        league_code = request.query_params.get("league")
        qs = Team.objects.select_related("league").all()
        if league_code:
            qs = qs.filter(league__poisson_key=league_code)
        return Response(TeamSerializer(qs.order_by("name"), many=True).data)


class ActiveDerbyView(APIView):
    """GET /api/predictions/active-derby/ — inarudisha derby inayoendelea sasa (null kama hakuna)."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for active derby

    def get(self, request):
        from django.core.cache import cache

        # Cache active derbies for 1 minute (derby status changes infrequently)
        cache_key = "active_derbies"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        now = timezone.now()
        derbies = ActiveDerby.objects.filter(is_active=True, starts_at__lte=now, ends_at__gte=now).order_by("starts_at")

        if not derbies.exists():
            data = {"active": False, "derbies": []}
            cache.set(cache_key, data, timeout=60)
            return Response(data)

        derbies_data = []
        for derby in derbies:
            derby_data = ActiveDerbySerializer(derby).data
            # Derby Hub extra data — H2H kati ya timu hizi mbili
            derby_data["head_to_head"] = head_to_head(derby.home_team_id, derby.away_team_id, n=10)
            derbies_data.append(derby_data)

        data = {"active": True, "derbies": derbies_data}
        cache.set(cache_key, data, timeout=60)  # 1 minute cache
        
        return Response(data)


class MatchAnalysisView(APIView):
    """GET /matches/{id}/analysis/ — 'Bashiri Track Record' ya mechi moja, baada ya FT."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for match analysis

    def get(self, request, match_id):
        match = get_object_or_404(
            Match.objects.select_related("league", "home_team", "away_team"), pk=match_id
        )

        if match.status != "FINISHED" or match.home_score is None or match.away_score is None:
            return Response(
                {"detail": "Bashiri Track Record inapatikana tu baada ya mechi kuisha."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        is_subscriber = bool(user and user.is_authenticated and getattr(user, "is_subscription_active", False))

        try:
            analysis = build_match_analysis(match, is_subscriber)
        except UnknownTeamError:
            return Response(
                {"detail": "Uchambuzi haupatikani — timu haina data ya kutosha."},
                status=status.HTTP_404_NOT_FOUND,
            )

        analysis["match"] = MatchListSerializer(match).data
        return Response(analysis)


class AITrackRecordView(APIView):
    """GET /ai-track-record/?league=EPL — utendaji wa AI kwa ujumla (snapshot ya siku)."""
    permission_classes = [AllowAny]
    throttle_classes = [NoThrottle]

    def get(self, request):
        from .models import AITrackRecordSnapshot

        snapshot = AITrackRecordSnapshot.objects.order_by("-generated_at").first()
        if not snapshot:
            return Response(
                {"detail": "Takwimu za AI Track Record bado hazijatengenezwa. Rudi baadaye."},
                status=status.HTTP_404_NOT_FOUND,
            )

        league_filter = request.query_params.get("league")
        data = snapshot.data

        scope_data = None
        scope = "overall"
        if league_filter:
            scope_data = data.get("leagues", {}).get(league_filter)
            if scope_data:
                scope = league_filter

        if not scope_data:
            scope_data = data.get("overall", {"markets": {}})

        return Response({
            "generated_at": snapshot.generated_at,
            "scope": scope,
            "markets": scope_data.get("markets", {}),
            "weekly_trend": data.get("weekly_trend", []),
            "boldest_calls": data.get("boldest_calls", []),
        })


class AIPerformanceStatsView(APIView):
    """
    GET /ai-performance/ — Daily & Weekly AI accuracy stats kwa profile page.
    Updated to use AIPick model for accurate tracking.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from django.core.cache import cache
        from datetime import timedelta
        from .models import AIPick

        # Cache for 5 minutes
        cache_key = "ai_performance_stats"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        today = timezone.localdate()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # Daily performance (today) - using AIPick model
        daily_picks = AIPick.objects.filter(created_at__date=today, feed='STANDARD')
        daily_total = daily_picks.count()
        daily_won = daily_picks.filter(status='WON').count()
        daily_lost = daily_picks.filter(status='LOST').count()
        daily_push = daily_picks.filter(status='PUSH').count()

        # Calculate daily accuracy
        daily_decisions = daily_won + daily_lost
        daily_accuracy = round((daily_won / daily_decisions * 100), 1) if daily_decisions > 0 else None

        # Daily market-specific accuracy
        daily_1x2_picks = daily_picks.filter(market__startswith='1x2')
        daily_1x2_won = daily_1x2_picks.filter(status='WON').count()
        daily_1x2_lost = daily_1x2_picks.filter(status='LOST').count()
        daily_1x2_accuracy = round((daily_1x2_won / (daily_1x2_won + daily_1x2_lost) * 100), 1) if (daily_1x2_won + daily_1x2_lost) > 0 else None

        daily_btts_picks = daily_picks.filter(market__startswith='btts')
        daily_btts_won = daily_btts_picks.filter(status='WON').count()
        daily_btts_lost = daily_btts_picks.filter(status='LOST').count()
        daily_btts_accuracy = round((daily_btts_won / (daily_btts_won + daily_btts_lost) * 100), 1) if (daily_btts_won + daily_btts_lost) > 0 else None

        daily_ou_picks = daily_picks.filter(market__startswith='over')
        daily_ou_won = daily_ou_picks.filter(status='WON').count()
        daily_ou_lost = daily_ou_picks.filter(status='LOST').count()
        daily_ou_accuracy = round((daily_ou_won / (daily_ou_won + daily_ou_lost) * 100), 1) if (daily_ou_won + daily_ou_lost) > 0 else None

        # High confidence (Elite tier) accuracy
        daily_elite_picks = daily_picks.filter(tier='ELITE')
        daily_elite_won = daily_elite_picks.filter(status='WON').count()
        daily_elite_lost = daily_elite_picks.filter(status='LOST').count()
        daily_elite_accuracy = round((daily_elite_won / (daily_elite_won + daily_elite_lost) * 100), 1) if (daily_elite_won + daily_elite_lost) > 0 else None

        # Calculate streak
        all_settled = AIPick.objects.filter(status__in=['WON', 'LOST']).order_by('settled_at')
        current_streak = 0
        best_streak = 0
        temp_streak = 0

        for pick in all_settled:
            if pick.status == 'WON':
                temp_streak += 1
                best_streak = max(best_streak, temp_streak)
            else:
                temp_streak = 0

        current_streak = temp_streak  # This is the ongoing streak from the end

        if daily_total > 0:
            daily_stats = {
                "accuracy_percentage": daily_accuracy,
                "total_predictions": daily_total,
                "correct_predictions": daily_won,
                "high_confidence_accuracy": daily_elite_accuracy,
                "market_accuracy": {
                    "1x2": daily_1x2_accuracy,
                    "btts": daily_btts_accuracy,
                    "over_under": daily_ou_accuracy,
                },
                "current_streak": current_streak,
                "best_streak": best_streak,
            }
        else:
            daily_stats = {
                "accuracy_percentage": None,
                "total_predictions": 0,
                "correct_predictions": 0,
                "high_confidence_accuracy": None,
                "market_accuracy": {
                    "1x2": None,
                    "btts": None,
                    "over_under": None,
                },
                "current_streak": 0,
                "best_streak": 0,
            }

        # Weekly performance (last 7 days) - using AIPick model
        weekly_picks = AIPick.objects.filter(
            created_at__date__gte=week_ago,
            created_at__date__lte=today,
            feed='STANDARD'
        )
        weekly_total = weekly_picks.count()
        weekly_won = weekly_picks.filter(status='WON').count()
        weekly_lost = weekly_picks.filter(status='LOST').count()
        weekly_push = weekly_picks.filter(status='PUSH').count()

        # Calculate weekly accuracy
        weekly_decisions = weekly_won + weekly_lost
        weekly_accuracy = round((weekly_won / weekly_decisions * 100), 1) if weekly_decisions > 0 else None

        # Weekly market-specific accuracy
        weekly_1x2_picks = weekly_picks.filter(market__startswith='1x2')
        weekly_1x2_won = weekly_1x2_picks.filter(status='WON').count()
        weekly_1x2_lost = weekly_1x2_picks.filter(status='LOST').count()
        weekly_1x2_accuracy = round((weekly_1x2_won / (weekly_1x2_won + weekly_1x2_lost) * 100), 1) if (weekly_1x2_won + weekly_1x2_lost) > 0 else None

        weekly_btts_picks = weekly_picks.filter(market__startswith='btts')
        weekly_btts_won = weekly_btts_picks.filter(status='WON').count()
        weekly_btts_lost = weekly_btts_picks.filter(status='LOST').count()
        weekly_btts_accuracy = round((weekly_btts_won / (weekly_btts_won + weekly_btts_lost) * 100), 1) if (weekly_btts_won + weekly_btts_lost) > 0 else None

        weekly_ou_picks = weekly_picks.filter(market__startswith='over')
        weekly_ou_won = weekly_ou_picks.filter(status='WON').count()
        weekly_ou_lost = weekly_ou_picks.filter(status='LOST').count()
        weekly_ou_accuracy = round((weekly_ou_won / (weekly_ou_won + weekly_ou_lost) * 100), 1) if (weekly_ou_won + weekly_ou_lost) > 0 else None

        # Weekly high confidence accuracy
        weekly_elite_picks = weekly_picks.filter(tier='ELITE')
        weekly_elite_won = weekly_elite_picks.filter(status='WON').count()
        weekly_elite_lost = weekly_elite_picks.filter(status='LOST').count()
        weekly_elite_accuracy = round((weekly_elite_won / (weekly_elite_won + weekly_elite_lost) * 100), 1) if (weekly_elite_won + weekly_elite_lost) > 0 else None

        weekly_stats = {
            "accuracy_percentage": weekly_accuracy,
            "total_predictions": weekly_total,
            "correct_predictions": weekly_won,
            "high_confidence_accuracy": weekly_elite_accuracy,
            "market_accuracy": {
                "1x2": weekly_1x2_accuracy,
                "btts": weekly_btts_accuracy,
                "over_under": weekly_ou_accuracy,
            },
            "best_streak": best_streak,
        }

        # Monthly performance (last 30 days) - using AIPick model
        monthly_picks = AIPick.objects.filter(
            created_at__date__gte=month_ago,
            created_at__date__lte=today,
            feed='STANDARD'
        )
        monthly_total = monthly_picks.count()
        monthly_won = monthly_picks.filter(status='WON').count()
        monthly_lost = monthly_picks.filter(status='LOST').count()

        # Calculate monthly accuracy
        monthly_decisions = monthly_won + monthly_lost
        monthly_accuracy = round((monthly_won / monthly_decisions * 100), 1) if monthly_decisions > 0 else None

        # Monthly high confidence accuracy
        monthly_elite_picks = monthly_picks.filter(tier='ELITE')
        monthly_elite_won = monthly_elite_picks.filter(status='WON').count()
        monthly_elite_lost = monthly_elite_picks.filter(status='LOST').count()
        monthly_elite_accuracy = round((monthly_elite_won / (monthly_elite_won + monthly_elite_lost) * 100), 1) if (monthly_elite_won + monthly_elite_lost) > 0 else None

        monthly_stats = {
            "accuracy_percentage": monthly_accuracy,
            "total_predictions": monthly_total,
            "correct_predictions": monthly_won,
            "high_confidence_accuracy": monthly_elite_accuracy,
        }

        # All-time performance - using AIPick model
        all_time_picks = AIPick.objects.filter(feed='STANDARD')
        all_time_total = all_time_picks.count()
        all_time_won = all_time_picks.filter(status='WON').count()
        all_time_lost = all_time_picks.filter(status='LOST').count()

        # Calculate all-time accuracy
        all_time_decisions = all_time_won + all_time_lost
        all_time_accuracy = round((all_time_won / all_time_decisions * 100), 1) if all_time_decisions > 0 else 0.0

        # All-time high confidence accuracy
        all_time_elite_picks = all_time_picks.filter(tier='ELITE')
        all_time_elite_won = all_time_elite_picks.filter(status='WON').count()
        all_time_elite_lost = all_time_elite_picks.filter(status='LOST').count()
        all_time_elite_accuracy = round((all_time_elite_won / (all_time_elite_won + all_time_elite_lost) * 100), 1) if (all_time_elite_won + all_time_elite_lost) > 0 else 0.0

        all_time_stats = {
            "accuracy_percentage": all_time_accuracy,
            "total_predictions": all_time_total,
            "correct_predictions": all_time_won,
            "high_confidence_accuracy": all_time_elite_accuracy,
        }

        # Weekly trend (last 7 days daily accuracy) - using AIPick model
        weekly_trend = []
        for i in range(7):
            date = today - timedelta(days=i)
            day_picks = AIPick.objects.filter(created_at__date=date, feed='STANDARD')
            day_total = day_picks.count()
            day_won = day_picks.filter(status='WON').count()
            day_lost = day_picks.filter(status='LOST').count()

            if day_total > 0:
                day_decisions = day_won + day_lost
                day_accuracy = round((day_won / day_decisions * 100), 1) if day_decisions > 0 else None
                weekly_trend.append({
                    "date": date.isoformat(),
                    "accuracy_percentage": day_accuracy,
                    "total_predictions": day_total,
                })
            else:
                # Add placeholder for days with no data
                weekly_trend.append({
                    "date": date.isoformat(),
                    "accuracy_percentage": None,
                    "total_predictions": 0,
                })

        data = {
            "daily": daily_stats,
            "weekly": weekly_stats,
            "monthly": monthly_stats,
            "all_time": all_time_stats,
            "weekly_trend": list(reversed(weekly_trend)),
        }

        cache.set(cache_key, data, timeout=300)  # 5 minutes cache
        return Response(data)


class CommandSearchView(APIView):
    """GET /api/predictions/command-search/?q=... — Command Palette (⌘K): matches+teams+leagues kwa pamoja."""
    permission_classes = [AllowAny]
    throttle_classes = [NoThrottle]

    def get(self, request):
        from .models import League, Team
        from .serializers import LeagueSerializer, TeamSerializer

        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response({"matches": [], "teams": [], "leagues": []})

        matches = (
            Match.objects.filter(Q(home_team__name__icontains=query) | Q(away_team__name__icontains=query))
            .select_related("league", "home_team", "away_team")
            .order_by("-kickoff_at")[:5]
        )
        teams = Team.objects.filter(name__icontains=query).select_related("league")[:5]
        leagues = League.objects.filter(name__icontains=query, is_active=True)[:3]

        return Response({
            "matches": MatchListSerializer(matches, many=True).data,
            "teams": TeamSerializer(teams, many=True).data,
            "leagues": LeagueSerializer(leagues, many=True).data,
        })


class TeamStandingsView(APIView):
    """GET /api/predictions/standings/ — Get current team standings."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        league_code = request.query_params.get("league")
        
        standings = TeamStanding.objects.select_related("team", "league")
        
        if league_code:
            standings = standings.filter(league__code=league_code)
        
        standings = standings.order_by("league", "position")
        
        return Response(TeamStandingSerializer(standings, many=True).data)


class TeamDetailView(APIView):
    """GET /api/predictions/teams/{id}/ — Get detailed team information like sofascore."""
    permission_classes = [AllowAny]
    
    def get(self, request, team_id):
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response({"detail": "Team not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get team standings
        standings = TeamStanding.objects.filter(team=team).select_related("league").first()
        
        # Get upcoming matches
        upcoming_matches = Match.objects.filter(
            Q(home_team=team) | Q(away_team=team),
            status="SCHEDULED"
        ).select_related("league", "home_team", "away_team").order_by("kickoff_at")[:10]
        
        # Get recent finished matches
        finished_matches = Match.objects.filter(
            Q(home_team=team) | Q(away_team=team),
            status="FINISHED"
        ).select_related("league", "home_team", "away_team").order_by("-kickoff_at")[:10]
        
        # Get league for the team
        league = team.league
        
        return Response({
            "team": TeamSerializer(team).data,
            "league": LeagueSerializer(league).data if league else None,
            "standings": TeamStandingSerializer(standings).data if standings else None,
            "upcoming_matches": MatchListSerializer(upcoming_matches, many=True).data,
            "finished_matches": MatchListSerializer(finished_matches, many=True).data,
        })


class LeagueDetailView(APIView):
    """GET /api/predictions/leagues/{code}/ — Get detailed league information like sofascore."""
    permission_classes = [AllowAny]
    
    def get(self, request, league_code):
        try:
            league = League.objects.get(code=league_code)
        except League.DoesNotExist:
            return Response({"detail": "League not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get league standings
        standings = TeamStanding.objects.filter(
            league=league
        ).select_related("team", "league").order_by("position")
        
        # Get upcoming matches
        upcoming_matches = Match.objects.filter(
            league=league,
            status="SCHEDULED"
        ).select_related("home_team", "away_team").order_by("kickoff_at")[:20]
        
        # Get recent finished matches
        finished_matches = Match.objects.filter(
            league=league,
            status="FINISHED"
        ).select_related("home_team", "away_team").order_by("-kickoff_at")[:20]
        
        # Get all teams in league
        teams = Team.objects.filter(league=league).order_by("name")
        
        return Response({
            "league": LeagueSerializer(league).data,
            "standings": TeamStandingSerializer(standings, many=True).data,
            "upcoming_matches": MatchListSerializer(upcoming_matches, many=True).data,
            "finished_matches": MatchListSerializer(finished_matches, many=True).data,
            "teams": TeamSerializer(teams, many=True).data,
        })


class HeadToHeadView(APIView):
    """GET /api/predictions/h2h/ — Get head-to-head history between teams."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        home_team_id = request.query_params.get("home_team")
        away_team_id = request.query_params.get("away_team")
        league_code = request.query_params.get("league")
        
        if not home_team_id or not away_team_id:
            return Response(
                {"detail": "home_team and away_team parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        h2h = HeadToHead.objects.select_related("home_team", "away_team", "league")
        
        if league_code:
            h2h = h2h.filter(league__code=league_code)
        
        # Check both team orderings
        h2h = h2h.filter(
            Q(home_team_id=home_team_id, away_team_id=away_team_id) |
            Q(home_team_id=away_team_id, away_team_id=home_team_id)
        ).first()
        
        if not h2h:
            return Response(
                {"detail": "No head-to-head data found for these teams"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(HeadToHeadSerializer(h2h).data)


class OddsListView(APIView):
    """GET /api/predictions/odds/ — Get odds for matches with filtering."""
    permission_classes = [AllowAny]
    throttle_classes = [NoThrottle]

    def get(self, request):
        from django.core.cache import cache
        
        # Get query parameters
        league = request.query_params.get("league")
        status = request.query_params.get("status", "upcoming")  # upcoming, live, all
        lang = request.query_params.get("lang", "en")
        
        # Build cache key
        cache_key = f"odds_list_{league}_{status}_{lang}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)
        
        # Build query
        queryset = OddsBookmaker.objects.select_related(
            "match", "match__league", "match__home_team", "match__away_team"
        )
        
        if league:
            queryset = queryset.filter(match__league__code=league)
        
        if status == "live":
            queryset = queryset.filter(match__status="LIVE", is_live=True)
        elif status == "upcoming":
            queryset = queryset.filter(match__status="SCHEDULED", is_live=False)
        # else: all
        
        queryset = queryset.order_by("-last_updated")[:100]
        
        # Serialize with language context
        from .serializers import OddsBookmakerSerializer
        serializer = OddsBookmakerSerializer(queryset, many=True, context={"lang": lang})
        data = serializer.data
        
        # Cache for 5 minutes
        cache.set(cache_key, data, timeout=300)
        
        return Response(data)


class MatchOddsView(APIView):
    """GET /api/predictions/matches/{match_id}/odds/ — Get odds for a specific match."""
    permission_classes = [AllowAny]
    throttle_classes = [NoThrottle]

    def get(self, request, match_id):
        from django.core.cache import cache
        
        lang = request.query_params.get("lang", "en")
        cache_key = f"match_odds_{match_id}_{lang}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)
        
        try:
            match = Match.objects.get(id=match_id)
        except Match.DoesNotExist:
            return Response({"detail": "Match not found"}, status=404)
        
        queryset = OddsBookmaker.objects.filter(match=match).select_related(
            "match", "match__league", "match__home_team", "match__away_team"
        ).order_by("-last_updated")
        
        from .serializers import OddsBookmakerSerializer
        serializer = OddsBookmakerSerializer(queryset, many=True, context={"lang": lang})
        data = serializer.data
        
        # Include odds history (last 10 updates)
        from .models import OddsUpdate
        history = OddsUpdate.objects.filter(
            bookmaker_odds__match=match
        ).select_related("bookmaker_odds").order_by("-timestamp")[:10]
        
        # Simple history serialization
        history_data = []
        for update in history:
            history_data.append({
                "bookmaker": update.bookmaker_odds.bookmaker_name,
                "market_type": update.bookmaker_odds.market_type,
                "home_win_odds": float(update.home_win_odds) if update.home_win_odds else None,
                "draw_odds": float(update.draw_odds) if update.draw_odds else None,
                "away_win_odds": float(update.away_win_odds) if update.away_win_odds else None,
                "timestamp": update.timestamp.isoformat(),
            })
        
        response_data = {
            "match": {
                "id": match.id,
                "home_team": match.home_team.name,
                "away_team": match.away_team.name,
                "kickoff_at": match.kickoff_at.isoformat(),
                "status": match.status,
            },
            "odds": data,
            "history": history_data,
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, response_data, timeout=300)
        
        return Response(response_data)


class BookmakersView(APIView):
    """GET /api/predictions/bookmakers/ — Get list of bookmakers and their supported leagues."""
    permission_classes = [AllowAny]
    throttle_classes = [NoThrottle]

    def get(self, request):
        from django.core.cache import cache
        from .models import OddsBookmaker
        
        cache_key = "bookmakers_list"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)
        
        # Get unique bookmakers and their leagues
        bookmakers = OddsBookmaker.objects.values(
            "bookmaker_name"
        ).distinct().order_by("bookmaker_name")
        
        bookmaker_data = []
        for bm in bookmakers:
            bookmaker_name = bm["bookmaker_name"]
            leagues = OddsBookmaker.objects.filter(
                bookmaker_name=bookmaker_name
            ).values_list("match__league__name", flat=True).distinct()
            
            bookmaker_data.append({
                "name": bookmaker_name,
                "leagues": list(leagues),
            })
        
        # Cache for 1 hour
        cache.set(cache_key, bookmaker_data, timeout=3600)
        
        return Response(bookmaker_data)
