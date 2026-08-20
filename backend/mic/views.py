"""
mic/views.py

Flow: 1) frontend inaomba signed upload signature 2) frontend inapakia
video MOJA KWA MOJA Cloudinary (haipitii server yetu) 3) frontend inatuma
video_url iliyopatikana kuunda MicReaction record.

Phase 1: Backend metadata extraction and validation (observation mode).
"""
import logging
import time
from datetime import timedelta

import cloudinary.utils
from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle

from .models import MicReaction, MicReactionVote
from .serializers import MicReactionSerializer, MicReactionVoteSerializer
from .services import extract_video_metadata, validate_video_duration
from core.cloudinary_utils import delete_video_from_cloudinary

logger = logging.getLogger(__name__)


class NoThrottle(AnonRateThrottle):
    rate = '10000/hour'  # effectively unlimited for mic endpoints


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

        video_url = serializer.validated_data["video_url"]
        frontend_duration = serializer.validated_data.get("duration_seconds")
        
        # Phase 2.5: Use Cloudinary duration from upload response (provided by frontend)
        # This is faster than waiting for Cloudinary API metadata extraction
        if frontend_duration and frontend_duration > 0:
            # Validate duration using Cloudinary-provided value
            is_valid, error_msg = validate_video_duration(frontend_duration)
            if not is_valid:
                logger.error(f"[VIDEO VALIDATION] Duration validation failed: {error_msg}")
                # Clean up uploaded video from Cloudinary
                try:
                    from .services import extract_public_id_from_url
                    public_id = extract_public_id_from_url(video_url)
                    if public_id:
                        delete_video_from_cloudinary(public_id)
                except Exception as e:
                    logger.error(f"[VIDEO VALIDATION] Failed to cleanup video: {str(e)}")
                return Response(
                    {"detail": error_msg},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            logger.info(f"[VIDEO VALIDATION] Using Cloudinary duration: {frontend_duration}s")
            serializer.validated_data["duration_seconds"] = frontend_duration
        else:
            # Fallback: No duration provided, set to 0 and will be updated later
            logger.warning(f"[VIDEO VALIDATION] No duration provided, setting to 0")
            serializer.validated_data["duration_seconds"] = 0

        # Validate file size
        max_bytes = settings.BASHIRI["MIC_MAX_FILE_SIZE_MB"] * 1024 * 1024
        reported_bytes = request.data.get("bytes")
        if reported_bytes and int(reported_bytes) > max_bytes:
            logger.error(f"[VIDEO VALIDATION] File size validation failed: {reported_bytes} bytes exceeds {max_bytes} bytes")
            # Clean up uploaded video from Cloudinary
            try:
                from .services import extract_public_id_from_url
                public_id = extract_public_id_from_url(video_url)
                if public_id:
                    delete_video_from_cloudinary(public_id)
            except Exception as e:
                logger.error(f"[VIDEO VALIDATION] Failed to cleanup video: {str(e)}")
            return Response(
                {"detail": f"Video ni kubwa mno — max {settings.BASHIRI['MIC_MAX_FILE_SIZE_MB']}MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create MicReaction immediately (non-blocking)
        reaction = serializer.save(user=request.user)
        logger.info(f"[VIDEO VALIDATION] MicReaction created successfully: {reaction.id}")
        
        # Fire-and-forget: Extract metadata asynchronously for logging/verification
        # This doesn't block the response
        try:
            import threading
            def extract_metadata_async():
                try:
                    metadata = extract_video_metadata(video_url)
                    if metadata:
                        logger.info(f"[VIDEO METADATA (ASYNC)] URL: {video_url}")
                        logger.info(f"[VIDEO METADATA (ASYNC)] Duration: {metadata['duration']}s")
                        logger.info(f"[VIDEO METADATA (ASYNC)] Codec: {metadata['codec']}")
                        logger.info(f"[VIDEO METADATA (ASYNC)] Resolution: {metadata['width']}x{metadata['height']}")
                        
                        # Compare with Cloudinary duration
                        if frontend_duration:
                            backend_duration = metadata["duration"]
                            duration_diff = abs(frontend_duration - backend_duration)
                            if duration_diff > 2:
                                logger.warning(f"[VIDEO METADATA (ASYNC)] Duration mismatch: Cloudinary={frontend_duration}s, Backend={backend_duration}s, Diff={duration_diff}s")
                            else:
                                logger.info(f"[VIDEO METADATA (ASYNC)] Duration match: Cloudinary={frontend_duration}s, Backend={backend_duration}s")
                        
                        # Update duration if backend has it and frontend didn't
                        if frontend_duration == 0 and backend_duration:
                            reaction.duration_seconds = round(backend_duration)
                            reaction.save()
                            logger.info(f"[VIDEO METADATA (ASYNC)] Updated duration to {round(backend_duration)}s")
                except Exception as e:
                    logger.error(f"[VIDEO METADATA (ASYNC)] Failed to extract metadata: {str(e)}")
            
            # Start async metadata extraction
            thread = threading.Thread(target=extract_metadata_async)
            thread.daemon = True
            thread.start()
        except Exception as e:
            logger.error(f"[VIDEO VALIDATION] Failed to start async metadata extraction: {str(e)}")
        
        return Response(MicReactionSerializer(reaction).data, status=status.HTTP_201_CREATED)


class MicReactionListView(APIView):
    """GET /api/mic/<match_id>/?team_side=HOME"""
    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for mic reactions list

    def get(self, request, match_id):
        from django.core.cache import cache

        team_side = request.query_params.get("team_side")
        
        # Cache reactions for 30 seconds (list changes frequently but not instantly)
        # Include user ID in cache key for authenticated users to get their vote status
        user_id = request.user.id if request.user.is_authenticated else "anon"
        cache_key = f"mic_reactions_{match_id}_{team_side or 'all'}_{user_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        qs = MicReaction.objects.filter(match_id=match_id, is_active=True).select_related("user")

        if team_side:
            qs = qs.filter(team_side=team_side)

        data = MicReactionSerializer(qs, many=True, context={'request': request}).data
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
        from django.core.cache import cache
        
        reaction = get_object_or_404(MicReaction, pk=reaction_id)
        emoji = request.data.get("emoji")

        vote, created = MicReactionVote.objects.get_or_create(
            mic_reaction=reaction, user=request.user, defaults={"emoji": emoji}
        )
        if not created:
            vote.emoji = emoji
            vote.save(update_fields=["emoji"])

        # Invalidate cache for this match's reactions to ensure fresh data
        match_id = reaction.match_id
        cache_keys_to_clear = [
            f"mic_reactions_{match_id}_all_anon",
            f"mic_reactions_{match_id}_all_{request.user.id}",
            f"mic_reactions_{match_id}_HOME_anon",
            f"mic_reactions_{match_id}_HOME_{request.user.id}",
            f"mic_reactions_{match_id}_AWAY_anon",
            f"mic_reactions_{match_id}_AWAY_{request.user.id}",
            f"mic_fan_of_match_{match_id}",  # Also invalidate best video cache
        ]
        for cache_key in cache_keys_to_clear:
            cache.delete(cache_key)

        return Response(MicReactionVoteSerializer(vote).data, status=status.HTTP_201_CREATED)


class FanOfMatchView(APIView):
    """GET /api/mic/<match_id>/fan-of-match/ — returns video with most votes"""
    permission_classes = [AllowAny]

    def get(self, request, match_id):
        from django.core.cache import cache
        from django.db.models import Count, Case, When, IntegerField, Sum

        # Cache best video for 1 minute (votes change frequently)
        cache_key = f"mic_fan_of_match_{match_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        # Calculate vote weights: FIRE=3, HUNDRED=2, others=1
        vote_weights = {
            "FIRE": 3,
            "HUNDRED": 2,
        }
        
        # Annotate each reaction with weighted vote count
        reactions = MicReaction.objects.filter(
            match_id=match_id, 
            is_active=True
        ).select_related("user").annotate(
            vote_count=Count("votes"),
            weighted_score=Sum(
                Case(
                    *[When(votes__emoji=emoji, then=weight) for emoji, weight in vote_weights.items()],
                    default=1,
                    output_field=IntegerField()
                )
            )
        ).order_by("-weighted_score", "-vote_count", "-created_at")

        winner = reactions.first()
        
        if not winner:
            data = {"detail": "Bado hakuna Fan of the Match kwa mechi hii."}
            cache.set(cache_key, data, timeout=60)
            return Response(data, status=status.HTTP_404_NOT_FOUND)

        data = MicReactionSerializer(winner).data
        # Add vote count to response for frontend display
        data["vote_count"] = winner.vote_count
        cache.set(cache_key, data, timeout=60)
        
        return Response(data)


class MicActiveMatchesView(APIView):
    """GET /api/mic/active-matches/ — mechi zenye posting window bado wazi (FT + 24h)."""
    permission_classes = [AllowAny]
    throttle_classes = [NoThrottle]

    def get(self, request):
        from django.core.cache import cache
        from django.db.models import Count
        from predictions.models import Match
        from predictions.serializers import MatchListSerializer

        # Cache results for 1 minute (match status changes infrequently)
        cache_key = "mic_active_matches"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        window_hours = settings.BASHIRI["MIC_POSTING_WINDOW_HOURS"]
        cutoff = timezone.now() - timedelta(hours=window_hours)

        # Optimize query with annotation to avoid N+1 problem
        matches = (
            Match.objects.filter(status="FINISHED", updated_at__gte=cutoff)
            .select_related("league", "home_team", "away_team")
            .annotate(reaction_count=Count("mic_reactions", filter=Q(mic_reactions__is_active=True)))
            .order_by("-updated_at")[:50]  # Limit to 50 matches to prevent timeout
        )

        results = []
        for m in matches:
            results.append({
                "match": MatchListSerializer(m).data, 
                "reaction_count": m.reaction_count
            })

        cache.set(cache_key, results, timeout=60)  # Cache for 1 minute
        return Response(results)


class UserMicReactionsView(APIView):
    """GET /api/mic/my-reactions/ — returns all mic reactions for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.core.cache import cache

        # Cache user reactions for 30 seconds
        cache_key = f"user_mic_reactions_{request.user.id}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        reactions = MicReaction.objects.filter(
            user=request.user
        ).select_related("user", "match").order_by("-created_at")

        data = MicReactionSerializer(reactions, many=True, context={'request': request}).data
        cache.set(cache_key, data, timeout=30)
        
        return Response(data)


class MicReactionDeleteView(APIView):
    """DELETE /api/mic/reactions/<reaction_id>/ — allows user to delete their own mic reaction."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, reaction_id):
        from django.core.cache import cache
        
        reaction = get_object_or_404(MicReaction, pk=reaction_id, user=request.user)
        
        # Store match_id for cache invalidation
        match_id = reaction.match_id
        
        reaction.delete()
        
        # Invalidate cache for this match's reactions
        cache_keys_to_clear = [
            f"mic_reactions_{match_id}_all_anon",
            f"mic_reactions_{match_id}_all_{request.user.id}",
            f"mic_reactions_{match_id}_HOME_anon",
            f"mic_reactions_{match_id}_HOME_{request.user.id}",
            f"mic_reactions_{match_id}_AWAY_anon",
            f"mic_reactions_{match_id}_AWAY_{request.user.id}",
            f"mic_mood_summary_{match_id}",
            f"mic_fan_of_match_{match_id}",
            f"user_mic_reactions_{request.user.id}",
        ]
        for cache_key in cache_keys_to_clear:
            cache.delete(cache_key)
        
        return Response({"detail": "Video imefutwa kikamilifu."}, status=status.HTTP_200_OK)