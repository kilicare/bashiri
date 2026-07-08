"""
mic/views.py

Flow: 1) frontend inaomba signed upload signature 2) frontend inapakia
video MOJA KWA MOJA Cloudinary (haipitii server yetu) 3) frontend inatuma
video_url iliyopatikana kuunda MicReaction record.
"""
import time

import cloudinary.utils
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MicReaction, MicReactionVote
from .serializers import MicReactionSerializer, MicReactionVoteSerializer


class MicUploadSignatureView(APIView):
    """GET /api/mic/upload-signature/ — inarudisha signature ya kupakia video Cloudinary moja kwa moja."""
    permission_classes = [IsAuthenticated]
    throttle_classes = []  # Disable throttling for video upload

    def get(self, request):
        timestamp = int(time.time())
        params_to_sign = {"timestamp": timestamp, "folder": "bashiri/mic"}

        signature = cloudinary.utils.api_sign_request(params_to_sign, settings.CLOUDINARY_STORAGE["API_SECRET"])

        return Response({
            "signature": signature,
            "timestamp": timestamp,
            "api_key": settings.CLOUDINARY_STORAGE["API_KEY"],
            "cloud_name": settings.CLOUDINARY_STORAGE["CLOUD_NAME"],
            "folder": "bashiri/mic",
        })


class MicCanPostView(APIView):
    """GET /api/mic/<match_id>/can-post/ — inaangalia posting window (FT + 24h)."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for can-post check

    def get(self, request, match_id):
        from django.core.cache import cache
        from predictions.models import Match

        # Cache can-post result for 1 minute (match status changes infrequently)
        cache_key = f"mic_can_post_{match_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        match = get_object_or_404(Match, pk=match_id)

        if match.status != "FINISHED":
            data = {"can_post": False, "reason": "Mechi bado haijaisha."}
            cache.set(cache_key, data, timeout=60)
            return Response(data)

        window_hours = settings.BASHIRI["MIC_POSTING_WINDOW_HOURS"]
        deadline = match.updated_at + __import__("datetime").timedelta(hours=window_hours)

        if timezone.now() > deadline:
            data = {"can_post": False, "reason": "Muda wa kupost umeisha (saa 24 baada ya Full Time)."}
            cache.set(cache_key, data, timeout=60)
            return Response(data)

        data = {"can_post": True}
        cache.set(cache_key, data, timeout=60)
        return Response(data)


class MicReactionCreateView(APIView):
    """POST /api/mic/ — body: {match, video_url, duration_seconds, mood, team_side}"""
    permission_classes = [IsAuthenticated]
    throttle_classes = []  # Disable throttling for video upload

    def post(self, request):
        serializer = MicReactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        max_duration = settings.BASHIRI["MIC_MAX_VIDEO_SECONDS"]
        if serializer.validated_data["duration_seconds"] > max_duration:
            return Response(
                {"detail": f"Video haiwezi kuzidi sekunde {max_duration}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reaction = serializer.save(user=request.user)
        return Response(MicReactionSerializer(reaction).data, status=status.HTTP_201_CREATED)


class MicReactionListView(APIView):
    """GET /api/mic/<match_id>/?team_side=HOME"""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for mic reactions list

    def get(self, request, match_id):
        from django.core.cache import cache

        team_side = request.query_params.get("team_side")
        
        # Cache reactions for 30 seconds (list changes frequently but not instantly)
        cache_key = f"mic_reactions_{match_id}_{team_side or 'all'}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        qs = MicReaction.objects.filter(match_id=match_id, is_active=True).select_related("user")

        if team_side:
            qs = qs.filter(team_side=team_side)

        data = MicReactionSerializer(qs, many=True).data
        cache.set(cache_key, data, timeout=30)  # 30 seconds cache
        
        return Response(data)


class MicMoodSummaryView(APIView):
    """GET /api/mic/<match_id>/mood-summary/ — asilimia za kila mood (Match Mood %)."""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for mood summary

    def get(self, request, match_id):
        from django.core.cache import cache

        # Cache mood summary for 30 seconds (changes when new reactions are posted)
        cache_key = f"mic_mood_summary_{match_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        reactions = MicReaction.objects.filter(match_id=match_id, is_active=True)
        total = reactions.count()

        if total == 0:
            data = {"total": 0, "breakdown": {}}
            cache.set(cache_key, data, timeout=30)
            return Response(data)

        breakdown = {}
        for mood_key, _label in MicReaction._meta.get_field("mood").choices:
            count = reactions.filter(mood=mood_key).count()
            breakdown[mood_key] = round((count / total) * 100, 1)

        data = {"total": total, "breakdown": breakdown}
        cache.set(cache_key, data, timeout=30)  # 30 seconds cache
        
        return Response(data)


class MicReactionVoteView(APIView):
    """POST /api/mic/reactions/<reaction_id>/vote/ — body: {"emoji": "FIRE"}"""
    permission_classes = [IsAuthenticated]

    def post(self, request, reaction_id):
        reaction = get_object_or_404(MicReaction, pk=reaction_id)
        emoji = request.data.get("emoji")

        vote, created = MicReactionVote.objects.get_or_create(
            mic_reaction=reaction, user=request.user, defaults={"emoji": emoji}
        )
        if not created:
            vote.emoji = emoji
            vote.save(update_fields=["emoji"])

        return Response(MicReactionVoteSerializer(vote).data, status=status.HTTP_201_CREATED)


class FanOfMatchView(APIView):
    """GET /api/mic/<match_id>/fan-of-match/"""
    permission_classes = [AllowAny]

    def get(self, request, match_id):
        winner = MicReaction.objects.filter(match_id=match_id, is_fan_of_match=True).select_related("user").first()
        if not winner:
            return Response({"detail": "Bado hakuna Fan of the Match kwa mechi hii."}, status=status.HTTP_404_NOT_FOUND)
        return Response(MicReactionSerializer(winner).data)