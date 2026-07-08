"""
matchroom/views.py

REST endpoint ya historia ya chat (mtu anayeungana baadaye anahitaji
kuona ujumbe wa nyuma — WebSocket peke yake haitoi historia).
"""
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from predictions.models import Match

from .models import MatchRoomMessage
from .serializers import MatchRoomMessageSerializer

ROOM_STATE = {
    "WATCH_PARTY": "watch_party",
    "LIVE": "live",
    "CLOSED": "closed",
}


class MatchRoomHistoryView(APIView):
    """GET /api/matchroom/<match_id>/history/"""
    permission_classes = [AllowAny]

    def get(self, request, match_id):
        match = get_object_or_404(Match, pk=match_id)
        messages = (
            MatchRoomMessage.objects.filter(match_id=match_id, is_hidden=False)
            .select_related("user")
            .order_by("-created_at")[:50]
        )
        return Response({
            "room_state": self._compute_room_state(match),
            "messages": MatchRoomMessageSerializer(reversed(list(messages)), many=True).data,
        })

    @staticmethod
    def _compute_room_state(match):
        from datetime import timedelta

        from django.utils import timezone

        now = timezone.now()

        if match.status == "LIVE":
            return ROOM_STATE["LIVE"]
        if match.status == "FINISHED":
            return ROOM_STATE["CLOSED"]
        if match.status == "SCHEDULED" and match.kickoff_at - timedelta(minutes=30) <= now < match.kickoff_at:
            return ROOM_STATE["WATCH_PARTY"]
        return ROOM_STATE["WATCH_PARTY"] if match.kickoff_at > now else ROOM_STATE["CLOSED"]