"""
predictions/views.py
"""
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ActiveDerby, Match, SavedMatch
from .serializers import ActiveDerbySerializer, MatchListSerializer, SavedMatchSerializer
from .services import UnknownTeamError, build_prediction_dashboard, head_to_head, team_form


class FixturesView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for fixtures

    def get(self, request):
        from django.core.cache import cache

        # Cache fixtures for 2 minutes (match schedule changes infrequently)
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

        # Cache live matches for 30 seconds (live status changes frequently)
        cache_key = "live_matches"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        matches = Match.objects.filter(status="LIVE").select_related(
            "league", "home_team", "away_team"
        ).order_by("kickoff_at")
        data = MatchListSerializer(matches, many=True).data
        cache.set(cache_key, data, timeout=30)  # 30 seconds cache
        
        return Response(data)


class FinishedMatchesView(APIView):
    """GET /finished/ — mechi zilizoisha (kama Sofascore)"""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for finished matches

    def get(self, request):
        from django.core.cache import cache

        # Get query params for pagination and filtering
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        league_code = request.query_params.get("league", None)
        team_name = request.query_params.get("team", None)

        # Cache key based on filters (shorter cache for filtered queries)
        cache_key = f"finished_matches_{limit}_{offset}_{league_code or 'all'}_{team_name or 'all'}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        # Base query for finished matches
        matches = Match.objects.filter(status="FINISHED").select_related(
            "league", "home_team", "away_team"
        )

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
    """GET /search/?q=... — tafuta mechi kwa jina la timu."""
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response({"results": []})

        matches = Match.objects.filter(
            Q(home_team__name__icontains=query) | Q(away_team__name__icontains=query)
        ).select_related("league", "home_team", "away_team").order_by("-kickoff_at")[:20]

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

    def get(self, request):
        from django.core.cache import cache
        from .models import League
        from .serializers import LeagueSerializer

        # Cache leagues for 1 hour (static data rarely changes)
        cache_key = "leagues_list"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        leagues = League.objects.filter(is_active=True)
        data = LeagueSerializer(leagues, many=True).data
        cache.set(cache_key, data, timeout=3600)  # 1 hour cache
        
        return Response(data)


class TeamListView(APIView):
    """GET /api/predictions/teams/?league=EPL — kwa Settings/teams page."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for static team data

    def get(self, request):
        from django.core.cache import cache
        from .models import Team
        from .serializers import TeamSerializer

        league_code = request.query_params.get("league")
        
        # Cache teams for 1 hour (static data rarely changes)
        cache_key = f"teams_list_{league_code or 'all'}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        qs = Team.objects.select_related("league").all()
        if league_code:
            qs = qs.filter(league__poisson_key=league_code)
        data = TeamSerializer(qs.order_by("name"), many=True).data
        cache.set(cache_key, data, timeout=3600)  # 1 hour cache
        
        return Response(data)


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
