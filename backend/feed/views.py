"""feed/views.py"""
from datetime import timedelta

from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Card, PollVote, UserPrediction
from .ranking import rank_cards
from .serializers import CardSerializer, PollVoteSerializer, UserPredictionCreateSerializer

FEED_WINDOW_DAYS = 2
MAX_FEED_ITEMS = 200


class FeedListView(APIView):
    """Milestone Cards ni PRIVATE — query-level filtering, sio UI-hiding."""
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        since = timezone.now() - timedelta(days=FEED_WINDOW_DAYS)
        today = timezone.localdate()
        tomorrow = today + timedelta(days=1)

        base_qs = Card.objects.filter(is_active=True, created_at__gte=since).select_related(
            "match", "match__home_team", "match__away_team", "match__league"
        )

        # Filter AI_PICK cards to show only today and tomorrow matches
        ai_pick_filter = (
            Q(type="AI_PICK", match__kickoff_at__date=today) |
            Q(type="AI_PICK", match__kickoff_at__date=tomorrow) |
            ~Q(type="AI_PICK")
        )

        if user and user.is_authenticated:
            visible = base_qs.filter(
                ai_pick_filter,
                Q(~Q(type="MILESTONE")) | Q(type="MILESTONE", data__user_id=user.id)
            )
        else:
            visible = base_qs.filter(ai_pick_filter).exclude(type="MILESTONE")

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
    """
    POST /api/feed/predictions/ — '📤 Share' action.

    MUHIMU: mtumiaji anachagua market+selection YAKE MWENYEWE (frontend
    inamuomba kuchagua kutoka kwenye masoko yote ya dashboard, HAKUNA
    default ya kiotomatiki kwenda AI pick). Server inahesabu
    matched_ai_pick BAADA ya kuunda record — hii ni taarifa ya uwazi,
    si "adhabu".
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserPredictionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_prediction = serializer.save(user=request.user)

        from predictions.services import get_ai_recommended_option

        ai_recommended = get_ai_recommended_option(user_prediction.match, user_prediction.market)
        user_prediction.matched_ai_pick = bool(ai_recommended and ai_recommended == user_prediction.selection)
        user_prediction.save(update_fields=["matched_ai_pick"])

        Card.objects.create(
            type="USER_PREDICTION", match=user_prediction.match,
            data={
                "user_id": request.user.id, "username": request.user.username,
                "accuracy_percentage": request.user.accuracy_percentage,
                "market": user_prediction.market, "selection": user_prediction.selection,
                "note": user_prediction.note, "emoji": user_prediction.emoji,
                "matched_ai_pick": user_prediction.matched_ai_pick,
            },
        )

        return Response(UserPredictionCreateSerializer(user_prediction).data, status=status.HTTP_201_CREATED)


class MyPredictionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        predictions = UserPrediction.objects.filter(user=request.user).select_related("match")
        return Response(UserPredictionCreateSerializer(predictions, many=True).data)


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


class LeaderboardView(APIView):
    """
    GET /api/feed/leaderboard/?mode=independent|all&period=weekly|monthly|all

    mode=independent (default) — "Ujuzi Wangu": predictions ambazo
    mtumiaji ALIZICHAGUA MWENYEWE (matched_ai_pick=False) pekee.
    mode=all — "Predictions Zote": jumla, ikiwemo zilizolingana na AI.

    period=weekly — inaanza SIKU YA JUMATATU ya wiki ya sasa (reset
    halisi kila wiki, si rolling 7 days).
    period=monthly — inaanza tarehe 1 ya mwezi wa sasa.
    period=all — data yote ya kudumu.

    Threshold (BASHIRI["LEADERBOARD_MIN_PREDICTIONS"]) inazuia mtu mwenye
    prediction 1 tu kuwa "namba 1" kwa bahati — lazima awe na idadi ya
    chini kabisa ya predictions zilizosuluhishwa ndani ya kipindi hicho.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        mode = request.query_params.get("mode", "independent")
        period = request.query_params.get("period", "all")

        since = self._period_start(period)

        qs = UserPrediction.objects.filter(is_correct__isnull=False).select_related("user")
        if since:
            qs = qs.filter(created_at__gte=since)
        if mode == "independent":
            qs = qs.filter(matched_ai_pick=False)

        stats = {}
        for up in qs:
            uid = up.user_id
            if uid not in stats:
                stats[uid] = {"user": up.user, "total": 0, "correct": 0}
            stats[uid]["total"] += 1
            if up.is_correct:
                stats[uid]["correct"] += 1

        threshold = settings.BASHIRI["LEADERBOARD_MIN_PREDICTIONS"].get(period, 5)

        results = []
        for s in stats.values():
            if s["total"] < threshold:
                continue
            accuracy = round((s["correct"] / s["total"]) * 100, 1)
            results.append({
                "username": s["user"].username,
                "accuracy_percentage": accuracy,
                "total_predictions": s["total"],
                "correct_predictions": s["correct"],
                "current_streak": s["user"].current_streak,
            })

        results.sort(key=lambda r: (-r["accuracy_percentage"], -r["total_predictions"]))

        for i, r in enumerate(results[:50]):
            r["rank"] = i + 1

        return Response({"mode": mode, "period": period, "results": results[:50]})

    @staticmethod
    def _period_start(period):
        now = timezone.now()
        if period == "weekly":
            days_since_monday = now.weekday()  # Jumatatu=0
            monday = (now - timedelta(days=days_since_monday)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            return monday
        if period == "monthly":
            return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return None  # "all" — hakuna kikomo cha tarehe
