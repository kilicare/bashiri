from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings

from .models import ChatMessage, ChatUsage
from .utils import get_chat_response


def _get_daily_limit(user):
    if user and user.is_authenticated:
        if getattr(user, "is_subscription_active", False):
            return settings.BASHIRI["SUBSCRIBER_AI_CHAT_DAILY"]
        return settings.BASHIRI["FREE_AI_CHAT_DAILY"]
    return settings.BASHIRI["GUEST_AI_CHAT_DAILY"]


class ChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        session_key = request.data.get("session_key", "") if not user else ""
        message_text = request.data.get("message", "").strip()

        if not message_text:
            return Response({"detail": "message inahitajika."}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        usage, _ = ChatUsage.objects.get_or_create(
            user=user, session_key=session_key, date=today, defaults={"count": 0}
        )

        limit = _get_daily_limit(user)
        if usage.count >= limit:
            return Response(
                {"detail": f"Umefikia kikomo cha maswali {limit} kwa siku. Jaribu kesho au panda PRO."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        history_qs = ChatMessage.objects.filter(user=user, session_key=session_key).order_by("created_at")[:10]
        history = [{"role": m.role, "content": m.content} for m in history_qs]

        ChatMessage.objects.create(user=user, session_key=session_key, role="user", content=message_text)

        reply = get_chat_response(message_text, history)

        ChatMessage.objects.create(user=user, session_key=session_key, role="assistant", content=reply)

        usage.count += 1
        usage.save(update_fields=["count"])

        return Response({
            "reply": reply,
            "remaining_today": max(0, limit - usage.count),
        })
