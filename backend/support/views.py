"""
support/views.py

Guest anaweza kutuma ticket (kwa guest_phone), lakini HAWEZI kuona
historia yake ya thread (hana account ya kuunganisha nayo) — hii ni
mpaka wa wazi wa scope kwa MVP: guest anayehitaji mazungumzo endelevu
anashauriwa kujisajili.
"""
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ContentReport, SupportMessage, SupportTicket
from .serializers import (
    ContentReportSerializer,
    CreateSupportTicketSerializer,
    SupportTicketDetailSerializer,
    SupportTicketListSerializer,
)


class SupportTicketListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        tickets = SupportTicket.objects.filter(user=request.user).order_by("-updated_at")
        return Response(SupportTicketListSerializer(tickets, many=True).data)

    def post(self, request):
        serializer = CreateSupportTicketSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user if request.user.is_authenticated else None

        ticket = SupportTicket.objects.create(
            user=user,
            guest_phone=data.get("guest_phone", ""),
            guest_name=data.get("guest_name", ""),
            type=data["type"],
            subject=data["subject"],
        )
        SupportMessage.objects.create(ticket=ticket, sender_type="USER", sender=user, content=data["message"])

        return Response(SupportTicketDetailSerializer(ticket).data, status=status.HTTP_201_CREATED)


class SupportTicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, pk=ticket_id, user=request.user)
        return Response(SupportTicketDetailSerializer(ticket).data)


class SupportTicketReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, pk=ticket_id, user=request.user)
        content = (request.data.get("content") or "").strip()
        if not content:
            return Response({"detail": "content inahitajika."}, status=status.HTTP_400_BAD_REQUEST)

        SupportMessage.objects.create(ticket=ticket, sender_type="USER", sender=request.user, content=content)

        if ticket.status in ("RESOLVED", "CLOSED"):
            ticket.status = "OPEN"
            ticket.save(update_fields=["status", "updated_at"])
        else:
            ticket.save(update_fields=["updated_at"])

        return Response(SupportTicketDetailSerializer(ticket).data)


class ContentReportCreateView(APIView):
    """POST /api/support/reports/ — body: {content_type, object_id, reason, note}"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ContentReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content_type = serializer.validated_data["content_type"]
        object_id = serializer.validated_data["object_id"]

        report, created = ContentReport.objects.get_or_create(
            reporter=request.user, content_type=content_type, object_id=object_id,
            defaults={
                "reason": serializer.validated_data["reason"],
                "note": serializer.validated_data.get("note", ""),
            },
        )
        if not created:
            return Response({"detail": "Tayari umesharipoti hii."}, status=status.HTTP_400_BAD_REQUEST)

        _check_auto_hide(content_type, object_id)

        return Response(ContentReportSerializer(report).data, status=status.HTTP_201_CREATED)


def _check_auto_hide(content_type: str, object_id: int):
    threshold = settings.BASHIRI["CONTENT_REPORT_AUTO_HIDE_THRESHOLD"]
    count = (
        ContentReport.objects.filter(content_type=content_type, object_id=object_id)
        .values("reporter").distinct().count()
    )
    if count < threshold:
        return

    hidden = False
    target_desc = ""

    if content_type == "MIC_REACTION":
        from mic.models import MicReaction

        obj = MicReaction.objects.filter(pk=object_id, is_active=True).first()
        if obj:
            obj.is_active = False
            obj.save(update_fields=["is_active"])
            hidden = True
            target_desc = f"MicReaction #{obj.id}"

    elif content_type == "USER_PREDICTION_CARD":
        from feed.models import Card

        obj = Card.objects.filter(pk=object_id, is_active=True).first()
        if obj:
            obj.is_active = False
            obj.save(update_fields=["is_active"])
            hidden = True
            target_desc = f"Card #{obj.id}"

    elif content_type == "ROOM_MESSAGE":
        from matchroom.models import MatchRoomMessage

        obj = MatchRoomMessage.objects.filter(pk=object_id, is_hidden=False).first()
        if obj:
            obj.is_hidden = True
            obj.save(update_fields=["is_hidden"])
            hidden = True
            target_desc = f"MatchRoomMessage #{obj.id}"

    if not hidden:
        return

    already_exists = SupportTicket.objects.filter(
        type="CONTENT_REPORT", related_content_type=content_type, related_object_id=object_id
    ).exists()
    if already_exists:
        return

    ticket = SupportTicket.objects.create(
        type="CONTENT_REPORT",
        subject=f"Auto-hidden: {target_desc}",
        related_content_type=content_type,
        related_object_id=object_id,
        status="OPEN",
    )
    SupportMessage.objects.create(
        ticket=ticket, sender_type="ADMIN", sender=None,
        content=(
            f"Content hii imefichwa moja kwa moja baada ya ripoti {threshold} tofauti "
            f"kutoka watumiaji tofauti. Tafadhali kagua na uamue kama ni kweli inavunja masharti."
        ),
    )
