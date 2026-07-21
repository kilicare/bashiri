"""
pulse/views.py

PulseSummaryView — endpoint MOJA inayokusanya data zote za 'Bashiri
Pulse' (Live Pulse Bar + Bento Grid), ili frontend isilazimike kuita
endpoints 6 tofauti (network round-trips nyingi kwenye mtandao wa
simu). Query zote ni nyepesi (counts + top N records), si data nzito.
"""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle


class NoThrottle(AnonRateThrottle):
    rate = '10000/hour'  # effectively unlimited for pulse endpoint


class PulseSummaryView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [NoThrottle]

    def get(self, request):
        return Response({
            "stats": self._build_stats(),
            "mic": self._build_mic(),
            "rooms": self._build_rooms(),
            "debates": self._build_debates(),
            "track_record": self._build_track_record(),
            "derby": self._build_derby(),
        })

    def _build_stats(self):
        from feed.models import Card
        from mic.models import MicReaction
        from predictions.models import Match

        today = timezone.localdate()

        live_rooms = Match.objects.filter(status="LIVE").count()
        mic_videos_today = MicReaction.objects.filter(is_active=True, created_at__date=today).count()
        open_debates = Card.objects.filter(type="DEBATE", is_active=True, data__is_closed=False).count()

        ai_weekly_accuracy = None
        snapshot = self._latest_snapshot()
        if snapshot:
            trend = snapshot.data.get("weekly_trend", [])
            if trend:
                ai_weekly_accuracy = trend[-1]["accuracy_percentage"]

        return {
            "live_rooms": live_rooms,
            "mic_videos_today": mic_videos_today,
            "open_debates": open_debates,
            "ai_weekly_accuracy": ai_weekly_accuracy,
        }

    def _build_mic(self):
        from mic.models import MicReaction
        from predictions.models import Match

        window_hours = settings.BASHIRI["MIC_POSTING_WINDOW_HOURS"]
        cutoff = timezone.now() - timedelta(hours=window_hours)

        featured = (
            MicReaction.objects.filter(is_active=True)
            .select_related("user", "match", "match__home_team", "match__away_team")
            .order_by("-created_at")[:3]
        )

        active_matches_count = Match.objects.filter(status="FINISHED", updated_at__gte=cutoff).count()

        return {
            "featured_reactions": [
                {
                    "id": r.id,
                    "match_id": r.match_id,
                    "video_url": r.video_url,
                    "username": r.user.username,
                    "mood": r.mood,
                    "home_team": r.match.home_team.name,
                    "away_team": r.match.away_team.name,
                }
                for r in featured
            ],
            "active_matches_count": active_matches_count,
        }

    def _build_rooms(self):
        from predictions.models import Match

        live_matches = (
            Match.objects.filter(status="LIVE")
            .select_related("league", "home_team", "away_team")
            .order_by("-kickoff_at")[:5]
        )

        return {
            "live_matches": [
                {
                    "id": m.id,
                    "home_team": m.home_team.name,
                    "away_team": m.away_team.name,
                    "league": m.league.name,
                    "home_score": m.home_score,
                    "away_score": m.away_score,
                }
                for m in live_matches
            ]
        }

    def _build_debates(self):
        from feed.models import Card

        open_debates = Card.objects.filter(
            type="DEBATE", is_active=True, data__is_closed=False
        ).order_by("-created_at")[:3]

        return {
            "open": [
                {
                    "id": c.id,
                    "question": c.data.get("question"),
                    "options": c.data.get("options", []),
                    "tallies": c.data.get("tallies", {}),
                    "vote_count": c.data.get("vote_count", 0),
                    "closes_at": c.data.get("closes_at"),
                }
                for c in open_debates
            ]
        }

    def _build_track_record(self):
        snapshot = self._latest_snapshot()
        if not snapshot:
            return {"weekly_trend": [], "latest_accuracy": None}

        trend = snapshot.data.get("weekly_trend", [])[-4:]
        latest = trend[-1]["accuracy_percentage"] if trend else None
        return {"weekly_trend": trend, "latest_accuracy": latest}

    def _build_derby(self):
        from predictions.models import ActiveDerby

        derby = ActiveDerby.objects.filter(is_active=True).select_related("home_team", "away_team").first()
        if not derby or not derby.is_currently_active:
            return None

        return {
            "derby_name": derby.derby_name,
            "home_team": derby.home_team.name,
            "away_team": derby.away_team.name,
            "theme_accent_color": derby.theme_accent_color,
        }

    @staticmethod
    def _latest_snapshot():
        from predictions.models import AITrackRecordSnapshot

        return AITrackRecordSnapshot.objects.order_by("-generated_at").first()
