from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
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

        reply, tool_name, tool_data = get_chat_response(message_text, history)

        ChatMessage.objects.create(user=user, session_key=session_key, role="assistant", content=reply)

        usage.count += 1
        usage.save(update_fields=["count"])

        response_data = {
            "reply": reply,
            "remaining_today": max(0, limit - usage.count),
        }
        
        if tool_name and tool_data:
            response_data["tool_result"] = {
                "tool_name": tool_name,
                "data": tool_data,
            }

        return Response(response_data)


class FeedbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message_id = request.data.get("message_id")
        feedback = request.data.get("feedback")  # "positive" or "negative"
        session_key = request.data.get("session_key", "")
        
        if not message_id or not feedback:
            return Response({"detail": "message_id na feedback zinahitajika."}, status=status.HTTP_400_BAD_REQUEST)
        
        if feedback not in ["positive", "negative"]:
            return Response({"detail": "feedback lazima iwe 'positive' au 'negative'."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = request.user if request.user.is_authenticated else None
            message = ChatMessage.objects.get(id=message_id, user=user, session_key=session_key)
            message.feedback = feedback
            message.save(update_fields=["feedback"])
            return Response({"success": True})
        except ChatMessage.DoesNotExist:
            return Response({"detail": "Ujumbe haujapatikana."}, status=status.HTTP_404_NOT_FOUND)
