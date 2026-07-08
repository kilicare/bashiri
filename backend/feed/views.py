"""feed/views.py"""
from datetime import timedelta

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import UserSerializer
from .models import Card, PollVote, UserPrediction
from .ranking import rank_cards
from .serializers import CardSerializer, PollVoteSerializer, UserPredictionCreateSerializer

FEED_WINDOW_DAYS = 2
MAX_FEED_ITEMS = 200


class FeedListView(APIView):
    """Milestone Cards ni PRIVATE — query-level filtering, sio UI-hiding."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for feed

    def get(self, request):
        user = request.user
        since = timezone.now() - timedelta(minutes=FEED_WINDOW_DAYS)

        base_qs = Card.objects.filter(is_active=True, created_at__gte=since).select_related(
            "match", "match__home_team", "match__away_team", "match__league"
        )

        if user and user.is_authenticated:
            visible = base_qs.filter(Q(~Q(type="MILESTONE")) | Q(type="MILESTONE", data__user_id=user.id))
        else:
            visible = base_qs.exclude(type="MILESTONE")

        cards = list(visible[:MAX_FEED_ITEMS])
        ranked = rank_cards(cards, user)

        try:
            limit = int(request.query_params.get("limit", 20))
            offset = int(request.query_params.get("offset", 0))
        except ValueError:
            limit, offset = 20, 0

        page = ranked[offset:offset + limit]
        return Response({"count": len(ranked), "results": CardSerializer(page, many=True).data})


class CreateUserPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserPredictionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_prediction = serializer.save(user=request.user)

        # Include match details in card data for better display
        from predictions.serializers import MatchListSerializer
        match_details = MatchListSerializer(user_prediction.match).data if user_prediction.match else None

        Card.objects.create(
            type="USER_PREDICTION", match=user_prediction.match,
            data={
                "user_id": request.user.id, "username": request.user.username,
                "avatar_url": request.user.avatar_url,
                "accuracy_percentage": request.user.accuracy_percentage,
                "market": user_prediction.market, "selection": user_prediction.selection,
                "note": user_prediction.note, "emoji": user_prediction.emoji,
                "match_details": match_details,
            },
        )
        return Response(UserPredictionCreateSerializer(user_prediction).data, status=status.HTTP_201_CREATED)


class MyPredictionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        predictions = UserPrediction.objects.filter(user=request.user).select_related("match")
        return Response(UserPredictionCreateSerializer(predictions, many=True).data)

    def delete(self, request):
        prediction_id = request.data.get("prediction_id")
        if not prediction_id:
            return Response({"detail": "prediction_id inahitajika."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            prediction = UserPrediction.objects.get(id=prediction_id, user=request.user)
            prediction.delete()
            return Response({"detail": "Prediction imefutwa kikamilifu."}, status=status.HTTP_204_NO_CONTENT)
        except UserPrediction.DoesNotExist:
            return Response({"detail": "Prediction haipatikani."}, status=status.HTTP_404_NOT_FOUND)


class PollVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, card_id):
        card = get_object_or_404(Card, pk=card_id, type="POLL")
        choice = request.data.get("choice")
        if not choice:
            return Response({"detail": "choice inahitajika."}, status=status.HTTP_400_BAD_REQUEST)

        vote, created = PollVote.objects.get_or_create(card=card, user=request.user, defaults={"choice": choice})
        if not created:
            return Response({"detail": "Tayari umepiga kura."}, status=status.HTTP_400_BAD_REQUEST)

        tallies = card.data.get("tallies", {})
        tallies[choice] = tallies.get(choice, 0) + 1
        card.data["tallies"] = tallies
        card.data["vote_count"] = card.data.get("vote_count", 0) + 1
        card.save(update_fields=["data"])

        return Response(PollVoteSerializer(vote).data, status=status.HTTP_201_CREATED)


class LeaderboardView(APIView):
    """GET /api/feed/leaderboard/?period=weekly|monthly|all — Top Predictors."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for leaderboard (cached data)

    def get(self, request):
        from django.core.cache import cache
        from accounts.models import User

        period = request.query_params.get("period", "all")
        
        # Cache ranking data for 5 minutes (leaderboard changes infrequently)
        cache_key = f"leaderboard_{period}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        qs = User.objects.filter(total_predictions__gt=0)

        # Kwa MVP: "weekly"/"monthly" zinatumia data ya jumla ya User (haihitaji
        # historical snapshot table bado) — filter halisi ya muda itaongezwa
        # Phase 1.5 kwa kuhifadhi accuracy snapshots za kila wiki/mwezi.
        qs = qs.order_by("-correct_predictions", "-total_predictions")[:50]

        results = [
            {
                "rank": i + 1,
                "username": u.username,
                "avatar_url": u.avatar_url,
                "accuracy_percentage": u.accuracy_percentage,
                "total_predictions": u.total_predictions,
                "correct_predictions": u.correct_predictions,
                "current_streak": u.current_streak,
            }
            for i, u in enumerate(qs)
        ]
        
        data = {"period": period, "results": results}
        cache.set(cache_key, data, timeout=300)  # 5 minutes cache
        
        return Response(data)


class DebateVoteView(APIView):
    """POST /api/feed/debates/{card_id}/vote/ — sawa na PollVoteView lakini kwa DEBATE type."""
    permission_classes = [IsAuthenticated]

    def get(self, request, card_id):
        """Check if user has already voted on this debate."""
        card = get_object_or_404(Card, pk=card_id, type="DEBATE")
        try:
            vote = PollVote.objects.get(card=card, user=request.user)
            return Response({"voted": True, "choice": vote.choice}, status=status.HTTP_200_OK)
        except PollVote.DoesNotExist:
            return Response({"voted": False}, status=status.HTTP_200_OK)

    def post(self, request, card_id):
        card = get_object_or_404(Card, pk=card_id, type="DEBATE")

        if card.data.get("voting_closed") or card.data.get("is_closed"):
            return Response({"detail": "Debate hii imefungwa kwa kura mpya."}, status=status.HTTP_400_BAD_REQUEST)

        choice = request.data.get("choice")
        if choice not in card.data.get("options", []):
            return Response({"detail": "choice si sahihi."}, status=status.HTTP_400_BAD_REQUEST)

        vote, created = PollVote.objects.get_or_create(card=card, user=request.user, defaults={"choice": choice})
        if not created:
            return Response({"detail": "Tayari umeshiriki kwenye debate hii."}, status=status.HTTP_400_BAD_REQUEST)

        tallies = card.data.get("tallies", {})
        tallies[choice] = tallies.get(choice, 0) + 1
        card.data["tallies"] = tallies
        card.data["vote_count"] = card.data.get("vote_count", 0) + 1
        card.save(update_fields=["data"])

        return Response(PollVoteSerializer(vote).data, status=status.HTTP_201_CREATED)
