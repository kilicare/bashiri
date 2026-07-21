"""feed/views.py"""
from datetime import timedelta

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle

from .models import Card, PollVote
from .ranking import rank_cards
from .serializers import CardSerializer, PollVoteSerializer

FEED_WINDOW_DAYS = 3
MAX_FEED_ITEMS = 200


class NoThrottle(AnonRateThrottle):
    rate = '10000/hour'  # effectively unlimited for feed endpoints


class FeedListView(APIView):
    """Milestone Cards ni PRIVATE — query-level filtering, sio UI-hiding."""
    permission_classes = [AllowAny]
    throttle_classes = []  # No throttling for feed endpoint

    def get(self, request):
        user = request.user
        since = timezone.now() - timedelta(days=FEED_WINDOW_DAYS)

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


class DebateVoteView(APIView):
    """POST /api/feed/debates/{card_id}/vote/ — sawa na PollVoteView lakini kwa DEBATE type."""
    permission_classes = [IsAuthenticated]

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


class DebateListView(APIView):
    """GET /api/feed/debates/?status=open|closed — archive KAMILI ya Debate cards, si Feed rotation."""
    permission_classes = [AllowAny]
    throttle_classes = [NoThrottle]

    def get(self, request):
        qs = Card.objects.filter(type="DEBATE", is_active=True).order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter == "open":
            qs = qs.filter(data__is_closed=False)
        elif status_filter == "closed":
            qs = qs.filter(data__is_closed=True)

        return Response(CardSerializer(qs[:100], many=True).data)
