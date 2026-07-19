"""herocarousel/views.py"""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import build_hero_slides


class HeroSlidesView(APIView):
    """GET /api/hero/slides/ — carousel ya Home Feed (custom + automatic)."""
    permission_classes = [AllowAny]

    def get(self, request):
        slides = build_hero_slides(request.user)
        return Response({"slides": slides})
