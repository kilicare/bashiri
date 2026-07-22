"""
predictions/views.py
"""
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle

from core.cache_utils import cache_response

from .models import ActiveDerby, Match, SavedMatch
from .serializers import ActiveDerbySerializer, MatchListSerializer, SavedMatchSerializer
from .services import UnknownTeamError, build_prediction_dashboard, build_match_analysis, head_to_head, team_form


class NoThrottle(AnonRateThrottle):
    rate = '10000/hour'  # effectively unlimited for search endpoints


class FixturesView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for fixtures

    def get(self, request):
        from django.core.cache import cache
        from datetime import datetime

        # Get date parameter (format: YYYY-MM-DD)
        date_str = request.query_params.get("date")
        
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                # Get all matches for the specific date (start of day to end of day)
                start_of_day = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
                end_of_day = timezone.make_aware(datetime.combine(target_date, datetime.max.time()))
                
                cache_key = f"fixtures_list_{date_str}"
                cached_data = cache.get(cache_key)
                
                if cached_data is not None:
                    return Response(cached_data)
                
                matches = (
                    Match.objects.filter(
                        kickoff_at__gte=start_of_day,
                        kickoff_at__lte=end_of_day
                    )
                    .select_related("league", "home_team", "away_team")
                    .order_by("kickoff_at")[:100]
                )
                data = MatchListSerializer(matches, many=True).data
                cache.set(cache_key, data, timeout=300)  # 5 minutes cache for specific date
                
                return Response(data)
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD"}, status=400)
        
        # Default: Show fixtures from now onwards (original behavior)
        cache_key = "fixtures_list"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        matches = (
            Match.objects.filter(status="SCHEDULED", kickoff_at__gte=timezone.now())
            .select_related("league", "home_team", "away_team").order_by("kickoff_at")[:100]
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

        # Cache overview for 2 minutes (match data changes infrequently)
        cache_key = f"match_overview_{match_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        match = get_object_or_404(
            Match.objects.select_related("league", "home_team", "away_team"), pk=match_id
        )
        data = {
            "match": MatchListSerializer(match).data,
            "home_form": team_form(match.home_team_id, exclude_match_id=match.id),
            "away_form": team_form(match.away_team_id, exclude_match_id=match.id),
            "head_to_head": head_to_head(match.home_team_id, match.away_team_id),
        }
        cache.set(cache_key, data, timeout=120)  # 2 minutes cache
        
        return Response(data)


class MatchDashboardView(APIView):
    """GET /matches/{id}/dashboard/ — Hatua 3, CORE FEATURE."""
    permission_classes = [AllowAny]

    def get(self, request, match_id):
        match = get_object_or_404(
            Match.objects.select_related("league", "home_team", "away_team"), pk=match_id
        )
        user = request.user
        is_subscriber = bool(user and user.is_authenticated and getattr(user, "is_subscription_active", False))

        try:
            dashboard = build_prediction_dashboard(match, is_subscriber)
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


class LeagueListView(APIView):
    """GET /api/predictions/leagues/ — kwa Settings/leagues page."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for static league data

    @cache_response("leagues", timeout=3600)  # saa 1 — ligi hazibadiliki mara kwa mara
    def get(self, request):
        from .models import League
        from .serializers import LeagueSerializer

        leagues = League.objects.filter(is_active=True)
        return Response(LeagueSerializer(leagues, many=True).data)


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
    """GET /ai-performance/ — Daily & Weekly AI accuracy stats kwa profile page."""
    permission_classes = [AllowAny]

    def get(self, request):
        from django.core.cache import cache
        from datetime import timedelta
        from .models import AIPerformance
        from feed.models import Card

        # Cache for 5 minutes
        cache_key = "ai_performance_stats"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        today = timezone.localdate()
        week_ago = today - timedelta(days=7)

        # Daily performance (today)
        daily_performance = AIPerformance.objects.filter(date=today).first()
        daily_stats = {
            "accuracy_percentage": daily_performance.accuracy_percentage if daily_performance else 0.0,
            "total_predictions": daily_performance.total_predictions if daily_performance else 0,
            "correct_predictions": daily_performance.correct_predictions if daily_performance else 0,
            "high_confidence_accuracy": daily_performance.high_confidence_accuracy if daily_performance else 0.0,
        }

        # Weekly performance (last 7 days)
        weekly_performances = AIPerformance.objects.filter(date__gte=week_ago, date__lte=today)
        weekly_total = weekly_performances.aggregate(
            total_predictions=Sum('total_predictions'),
            correct_predictions=Sum('correct_predictions'),
            high_conf_predictions=Sum('high_confidence_predictions'),
            high_conf_correct=Sum('high_confidence_correct')
        )

        weekly_total_predictions = weekly_total['total_predictions'] or 0
        weekly_correct = weekly_total['correct_predictions'] or 0
        weekly_high_conf = weekly_total['high_conf_predictions'] or 0
        weekly_high_conf_correct = weekly_total['high_conf_correct'] or 0

        weekly_accuracy = round((weekly_correct / weekly_total_predictions) * 100, 1) if weekly_total_predictions > 0 else 0.0
        weekly_high_conf_accuracy = round((weekly_high_conf_correct / weekly_high_conf) * 100, 1) if weekly_high_conf > 0 else 0.0

        weekly_stats = {
            "accuracy_percentage": weekly_accuracy,
            "total_predictions": weekly_total_predictions,
            "correct_predictions": weekly_correct,
            "high_confidence_accuracy": weekly_high_conf_accuracy,
        }

        # All-time performance
        all_time_performances = AIPerformance.objects.all()
        all_time_total = all_time_performances.aggregate(
            total_predictions=Sum('total_predictions'),
            correct_predictions=Sum('correct_predictions'),
            high_conf_predictions=Sum('high_confidence_predictions'),
            high_conf_correct=Sum('high_confidence_correct')
        )

        all_time_total_predictions = all_time_total['total_predictions'] or 0
        all_time_correct = all_time_total['correct_predictions'] or 0
        all_time_high_conf = all_time_total['high_conf_predictions'] or 0
        all_time_high_conf_correct = all_time_total['high_conf_correct'] or 0

        all_time_accuracy = round((all_time_correct / all_time_total_predictions) * 100, 1) if all_time_total_predictions > 0 else 0.0
        all_time_high_conf_accuracy = round((all_time_high_conf_correct / all_time_high_conf) * 100, 1) if all_time_high_conf > 0 else 0.0

        all_time_stats = {
            "accuracy_percentage": all_time_accuracy,
            "total_predictions": all_time_total_predictions,
            "correct_predictions": all_time_correct,
            "high_confidence_accuracy": all_time_high_conf_accuracy,
        }

        # Weekly trend (last 7 days daily accuracy)
        weekly_trend = []
        for i in range(7):
            date = today - timedelta(days=i)
            perf = AIPerformance.objects.filter(date=date).first()
            if perf:
                weekly_trend.append({
                    "date": date.isoformat(),
                    "accuracy_percentage": perf.accuracy_percentage,
                    "total_predictions": perf.total_predictions,
                })

        data = {
            "daily": daily_stats,
            "weekly": weekly_stats,
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
