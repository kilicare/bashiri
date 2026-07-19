"""
dashboard/views.py

Admin API kamili: login, stats, users, matches, leagues/teams,
transactions/subscriptions, cards (moderation), broadcast notifications,
ML model status, audit log.
"""
import json
import logging
import os
from datetime import timedelta

from django.contrib.auth import authenticate
from django.db.models import Avg, Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

from accounts.models import User
from accounts.serializers import UserSerializer
from feed.models import Card
from payments.models import Subscription, Transaction
from predictions.models import League, Match, Team

from .models import AdminActionLog
from .permissions import IsBashiriAdmin
from .serializers import (
    AdminActionLogSerializer,
    AdminActiveDerbySerializer,
    AdminCardSerializer,
    AdminContentReportSerializer,
    AdminCustomSlideSerializer,
    AdminLeagueSerializer,
    AdminLoginSerializer,
    AdminMatchSerializer,
    AdminSubscriptionSerializer,
    AdminSupportTicketDetailSerializer,
    AdminSupportTicketListSerializer,
    AdminTeamSerializer,
    AdminTransactionSerializer,
    AdminUserDetailSerializer,
    AdminUserListSerializer,
)


def _log_action(admin_user, action, target_description, details=None):
    AdminActionLog.objects.create(
        admin_user=admin_user, action=action,
        target_description=target_description, details=details or {},
    )


# ============================================================
# AUTH
# ============================================================
class AdminLoginView(APIView):
    """POST /api/dashboard/login/ — phone_number + password (SI OTP — hii ni admin pekee)."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            phone_number=serializer.validated_data["phone_number"],
            password=serializer.validated_data["password"],
        )

        if user is None:
            return Response({"detail": "Namba ya simu au password si sahihi."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_staff:
            return Response({"detail": "Akaunti hii si ya Admin."}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        })


# ============================================================
# DASHBOARD STATS
# ============================================================
class DashboardStatsView(APIView):
    """GET /api/dashboard/stats/ — namba za jumla za app nzima."""
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_users = User.objects.count()
        total_subscribers = User.objects.filter(is_subscriber=True, subscription_expires_at__gt=now).count()
        new_users_this_month = User.objects.filter(date_joined__gte=month_start).count()

        revenue_this_month = (
            Transaction.objects.filter(status="SUCCESS", created_at__gte=month_start)
            .aggregate(total=Sum("amount_tzs"))["total"] or 0
        )
        revenue_all_time = (
            Transaction.objects.filter(status="SUCCESS").aggregate(total=Sum("amount_tzs"))["total"] or 0
        )

        total_predictions_ai = Card.objects.filter(type="RESULT_RECAP").count()
        correct_predictions_ai = Card.objects.filter(type="RESULT_RECAP", data__was_correct=True).count()
        ai_accuracy = round((correct_predictions_ai / total_predictions_ai) * 100, 1) if total_predictions_ai else 0

        matches_today = Match.objects.filter(kickoff_at__date=now.date()).count()
        live_matches_now = Match.objects.filter(status="LIVE").count()

        pending_transactions = Transaction.objects.filter(status="PENDING").count()

        return Response({
            "total_users": total_users,
            "total_subscribers": total_subscribers,
            "new_users_this_month": new_users_this_month,
            "revenue_this_month_tzs": revenue_this_month,
            "revenue_all_time_tzs": revenue_all_time,
            "ai_prediction_accuracy": ai_accuracy,
            "total_ai_predictions_resolved": total_predictions_ai,
            "matches_today": matches_today,
            "live_matches_now": live_matches_now,
            "pending_transactions": pending_transactions,
        })


# ============================================================
# USERS MANAGEMENT
# ============================================================
class AdminUserListView(APIView):
    """GET /api/dashboard/users/?search=&is_subscriber=&is_active=&limit=&offset="""
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        qs = User.objects.all().order_by("-date_joined")

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(Q(phone_number__icontains=search) | Q(username__icontains=search))

        is_subscriber = request.query_params.get("is_subscriber")
        if is_subscriber is not None:
            qs = qs.filter(is_subscriber=is_subscriber.lower() == "true")

        is_active = request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")

        try:
            limit = int(request.query_params.get("limit", 30))
            offset = int(request.query_params.get("offset", 0))
        except ValueError:
            limit, offset = 30, 0

        total = qs.count()
        page = qs[offset:offset + limit]
        return Response({"count": total, "results": AdminUserListSerializer(page, many=True).data})


class AdminUserDetailView(APIView):
    """GET/PATCH /api/dashboard/users/{id}/ — PATCH: {"is_active": false} kuban, {"is_staff": true} kumfanya admin."""
    permission_classes = [IsBashiriAdmin]

    def get(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        return Response(AdminUserDetailSerializer(user).data)

    def patch(self, request, user_id):
        target_user = get_object_or_404(User, pk=user_id)

        if "is_active" in request.data:
            new_value = bool(request.data["is_active"])
            target_user.is_active = new_value
            target_user.save(update_fields=["is_active"])
            _log_action(
                request.user, "BAN_USER" if not new_value else "UNBAN_USER",
                f"User #{target_user.id} ({target_user.phone_number})",
            )

        if "is_staff" in request.data:
            new_value = bool(request.data["is_staff"])
            target_user.is_staff = new_value
            target_user.save(update_fields=["is_staff"])
            _log_action(
                request.user, "MAKE_ADMIN" if new_value else "REVOKE_ADMIN",
                f"User #{target_user.id} ({target_user.phone_number})",
            )

        return Response(AdminUserDetailSerializer(target_user).data)

    def delete(self, request, user_id):
        target_user = get_object_or_404(User, pk=user_id)

        # Prevent deleting self
        if target_user.id == request.user.id:
            return Response({"detail": "Huuwezi kufuta akaunti yako mwenyewe."}, status=status.HTTP_400_BAD_REQUEST)

        phone_number = target_user.phone_number
        user_id_str = str(target_user.id)

        target_user.delete()

        _log_action(
            request.user, "DELETE_USER",
            f"User #{user_id_str} ({phone_number})",
            {"deleted_at": timezone.now().isoformat()},
        )

        return Response({"detail": "Mtumiaji amefutwa kikamilifu."}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# MATCHES MANAGEMENT
# ============================================================
class AdminMatchListView(APIView):
    """GET /api/dashboard/matches/?status=&league="""
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        qs = Match.objects.select_related("league", "home_team", "away_team").order_by("-kickoff_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        league_filter = request.query_params.get("league")
        if league_filter:
            qs = qs.filter(league__name=league_filter)

        return Response(AdminMatchSerializer(qs[:200], many=True).data)


class AdminMatchDetailView(APIView):
    """GET/PATCH /api/dashboard/matches/{id}/ — hasa kwa is_big_match, status ya mkono, score za mkono."""
    permission_classes = [IsBashiriAdmin]

    def get(self, request, match_id):
        match = get_object_or_404(Match.objects.select_related("league", "home_team", "away_team"), pk=match_id)
        return Response(AdminMatchSerializer(match).data)

    def patch(self, request, match_id):
        from django.core.cache import cache

        match = get_object_or_404(Match, pk=match_id)
        serializer = AdminMatchSerializer(match, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Invalidate caches when match data changes (especially for live matches)
        if match.status == "LIVE" or "status" in request.data or "home_score" in request.data or "away_score" in request.data:
            cache.delete("live_matches")
            cache.delete("feed_list")
            logger.info(f"Cache invalidated for match #{match.id} (admin update)")

        if "is_big_match" in request.data:
            _log_action(request.user, "TOGGLE_BIG_MATCH", f"Match #{match.id}", {"is_big_match": request.data["is_big_match"]})
        else:
            _log_action(request.user, "UPDATE_MATCH", f"Match #{match.id}", request.data)

        return Response(AdminMatchSerializer(match).data)


# ============================================================
# LEAGUES & TEAMS
# ============================================================
class AdminLeagueListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        leagues = League.objects.all().order_by("name")
        return Response(AdminLeagueSerializer(leagues, many=True).data)

    def patch(self, request):
        """Batch toggle is_active: body = {"league_id": 1, "is_active": false}"""
        league = get_object_or_404(League, pk=request.data.get("league_id"))
        league.is_active = bool(request.data.get("is_active", league.is_active))
        league.save(update_fields=["is_active"])
        return Response(AdminLeagueSerializer(league).data)


class AdminTeamListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        league_id = request.query_params.get("league_id")
        qs = Team.objects.select_related("league").order_by("name")
        if league_id:
            qs = qs.filter(league_id=league_id)
        return Response(AdminTeamSerializer(qs, many=True).data)


# ============================================================
# PAYMENTS OVERSIGHT
# ============================================================
class AdminTransactionListView(APIView):
    """GET /api/dashboard/transactions/?status=&limit=&offset="""
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        qs = Transaction.objects.select_related("user").order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        try:
            limit = int(request.query_params.get("limit", 30))
            offset = int(request.query_params.get("offset", 0))
        except ValueError:
            limit, offset = 30, 0

        total = qs.count()
        page = qs[offset:offset + limit]
        return Response({"count": total, "results": AdminTransactionSerializer(page, many=True).data})


class AdminManualSubscriptionView(APIView):
    """
    POST /api/dashboard/transactions/manual-activate/
    body: {"user_id": 5, "plan": "monthly", "reason": "Malipo ya M-Pesa yalithibitishwa nje ya app"}

    Kwa hali za support (mfano mtumiaji amelipa lakini callback haikufika).
    """
    permission_classes = [IsBashiriAdmin]

    def post(self, request):
        user = get_object_or_404(User, pk=request.data.get("user_id"))
        plan = request.data.get("plan")
        reason = request.data.get("reason", "")

        if plan not in ("weekly", "monthly"):
            return Response({"detail": "plan lazima iwe 'weekly' au 'monthly'."}, status=status.HTTP_400_BAD_REQUEST)

        from django.conf import settings as django_settings

        amount = django_settings.BASHIRI["SUBSCRIPTION_PRICES"][f"{plan}_tzs"]
        now = timezone.now()
        base_start = (
            user.subscription_expires_at
            if (user.is_subscriber and user.subscription_expires_at and user.subscription_expires_at > now)
            else now
        )
        duration = timedelta(days=7) if plan == "weekly" else timedelta(days=30)
        ends_at = base_start + duration

        subscription = Subscription.objects.create(
            user=user, plan=plan, amount_tzs=amount, starts_at=base_start, ends_at=ends_at, is_active=True,
        )
        user.is_subscriber = True
        user.subscription_expires_at = ends_at
        user.save(update_fields=["is_subscriber", "subscription_expires_at"])

        _log_action(
            request.user, "MANUAL_SUBSCRIPTION",
            f"User #{user.id} ({user.phone_number})",
            {"plan": plan, "reason": reason, "ends_at": ends_at.isoformat()},
        )

        return Response(AdminSubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)


class AdminSubscriptionListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        qs = Subscription.objects.select_related("user").order_by("-created_at")[:100]
        return Response(AdminSubscriptionSerializer(qs, many=True).data)


# ============================================================
# CONTENT MODERATION (Cards)
# ============================================================
class AdminCardListView(APIView):
    """GET /api/dashboard/cards/?type=USER_PREDICTION — hasa kwa moderation ya user-generated content."""
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        qs = Card.objects.order_by("-created_at")
        type_filter = request.query_params.get("type")
        if type_filter:
            qs = qs.filter(type=type_filter)
        return Response(AdminCardSerializer(qs[:100], many=True).data)


class AdminCardToggleActiveView(APIView):
    """PATCH /api/dashboard/cards/{id}/toggle/ — ficha/onyesha card (mfano user prediction isiyofaa)."""
    permission_classes = [IsBashiriAdmin]

    def patch(self, request, card_id):
        card = get_object_or_404(Card, pk=card_id)
        card.is_active = not card.is_active
        card.save(update_fields=["is_active"])

        _log_action(
            request.user, "ACTIVATE_CARD" if card.is_active else "DEACTIVATE_CARD",
            f"Card #{card.id} ({card.type})",
        )

        return Response(AdminCardSerializer(card).data)


# ============================================================
# BROADCAST NOTIFICATIONS
# ============================================================
class AdminBroadcastNotificationView(APIView):
    """
    POST /api/dashboard/notifications/broadcast/
    body: {"title": "...", "body": "...", "segment": "all"|"subscribers"|"free"}
    """
    permission_classes = [IsBashiriAdmin]

    def post(self, request):
        from notifications.models import Notification

        title = request.data.get("title", "").strip()
        body = request.data.get("body", "").strip()
        segment = request.data.get("segment", "all")

        if not title or not body:
            return Response({"detail": "title na body vinahitajika."}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(is_active=True, username__isnull=False)
        if segment == "subscribers":
            users = users.filter(is_subscriber=True, subscription_expires_at__gt=timezone.now())
        elif segment == "free":
            users = users.exclude(is_subscriber=True, subscription_expires_at__gt=timezone.now())

        notifications = [
            Notification(user=u, type="DAILY_PICKS", title=title, body=body, data={"broadcast": True})
            for u in users
        ]
        Notification.objects.bulk_create(notifications)

        _log_action(
            request.user, "BROADCAST_NOTIFICATION", f"Segment: {segment}",
            {"title": title, "body": body, "recipient_count": len(notifications)},
        )

        return Response({"detail": f"Notification zimetumwa kwa watumiaji {len(notifications)}."})


# ============================================================
# ML MODEL STATUS
# ============================================================
class AdminMLModelStatusView(APIView):
    """GET /api/dashboard/ml-status/ — inaonyesha JSON ya model iliyopo, bila kuipakia kwenye memory ya app."""
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        path = os.path.join(os.path.dirname(__file__), "..", "predictions", "ml", "data", "bashiri_prediction_models.json")
        path = os.path.abspath(path)

        if not os.path.exists(path):
            return Response({"loaded": False, "detail": "Faili ya model haijapatikana."})

        with open(path, "r") as f:
            data = json.load(f)

        leagues_info = {
            key: {"home_advantage": val["home_advantage"], "team_count": len(val["teams"])}
            for key, val in data.get("leagues", {}).items()
        }

        return Response({
            "loaded": True,
            "generated_at": data.get("generated_at"),
            "leagues": leagues_info,
        })


# ============================================================
# AUDIT LOG
# ============================================================
class AdminActionLogListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        logs = AdminActionLog.objects.select_related("admin_user").order_by("-created_at")[:100]
        return Response(AdminActionLogSerializer(logs, many=True).data)


# ============================================================
# LOCAL DERBY MODE MANAGEMENT
# ============================================================
class AdminActiveDerbyListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        from predictions.models import ActiveDerby

        derbies = ActiveDerby.objects.all().order_by("-starts_at")[:50]
        return Response(AdminActiveDerbySerializer(derbies, many=True).data)

    def post(self, request):
        serializer = AdminActiveDerbySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        derby = serializer.save()

        _log_action(request.user, "CREATE_MATCH", f"ActiveDerby: {derby.derby_name}", request.data)
        return Response(AdminActiveDerbySerializer(derby).data, status=status.HTTP_201_CREATED)


class AdminActiveDerbyDetailView(APIView):
    permission_classes = [IsBashiriAdmin]

    def patch(self, request, derby_id):
        from predictions.models import ActiveDerby

        derby = get_object_or_404(ActiveDerby, pk=derby_id)
        serializer = AdminActiveDerbySerializer(derby, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        _log_action(request.user, "UPDATE_MATCH", f"ActiveDerby #{derby.id}", request.data)
        return Response(AdminActiveDerbySerializer(derby).data)

    def delete(self, request, derby_id):
        from predictions.models import ActiveDerby

        derby = get_object_or_404(ActiveDerby, pk=derby_id)
        derby_name = derby.derby_name
        derby.delete()

        _log_action(request.user, "DELETE_CARD", f"ActiveDerby #{derby_id}", {"derby_name": derby_name})
        return Response({"detail": "Derby imefutwa kikamilifu."}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# DEBATE CARD MANAGEMENT
# ============================================================
class AdminCreateDebateView(APIView):
    """
    POST body: {"question": "...", "options": ["YES", "NO"], "closes_in_hours": 48,
                "match_id": null}
    """
    permission_classes = [IsBashiriAdmin]

    def post(self, request):
        question = request.data.get("question", "").strip()
        options = request.data.get("options", [])
        closes_in_hours = int(request.data.get("closes_in_hours", 48))
        match_id = request.data.get("match_id")

        if not question or len(options) < 2:
            return Response({"detail": "question na options (angalau 2) vinahitajika."}, status=status.HTTP_400_BAD_REQUEST)

        closes_at = timezone.now() + timedelta(hours=closes_in_hours)

        card = Card.objects.create(
            type="DEBATE",
            match_id=match_id,
            data={
                "question": question,
                "options": options,
                "tallies": {},
                "vote_count": 0,
                "closes_at": closes_at.isoformat(),
                "is_closed": False,
                "voting_closed": False,
                "result": None,
            },
        )

        _log_action(request.user, "CREATE_MATCH", f"Debate Card #{card.id}", {"question": question})
        return Response(AdminCardSerializer(card).data, status=status.HTTP_201_CREATED)


class AdminResolveDebateView(APIView):
    """POST body: {"result": "YES"} — admin anaweka matokeo ya mwisho baada ya tukio halisi."""
    permission_classes = [IsBashiriAdmin]

    def post(self, request, card_id):
        card = get_object_or_404(Card, pk=card_id, type="DEBATE")
        result = request.data.get("result")

        if result not in card.data.get("options", []):
            return Response({"detail": "result lazima iwe mojawapo ya options za debate."}, status=status.HTTP_400_BAD_REQUEST)

        card.data["is_closed"] = True
        card.data["result"] = result
        card.save(update_fields=["data"])

        _log_action(request.user, "UPDATE_MATCH", f"Debate Card #{card.id} resolved", {"result": result})
        return Response(AdminCardSerializer(card).data)


class AdminDeleteDebateView(APIView):
    """DELETE /api/dashboard/debates/{card_id}/ — admin anafuta debate card."""
    permission_classes = [IsBashiriAdmin]

    def delete(self, request, card_id):
        card = get_object_or_404(Card, pk=card_id, type="DEBATE")
        question = card.data.get("question", "Unknown")
        card.delete()

        _log_action(request.user, "DELETE_CARD", f"Debate Card #{card_id}", {"question": question})
        return Response({"detail": "Debate imefutwa kikamilifu."}, status=status.HTTP_204_NO_CONTENT)


class AdminMatchRoomMessageHideView(APIView):
    permission_classes = [IsBashiriAdmin]

    def patch(self, request, message_id):
        from matchroom.models import MatchRoomMessage

        message = get_object_or_404(MatchRoomMessage, pk=message_id)
        message.is_hidden = True
        message.save(update_fields=["is_hidden"])

        _log_action(request.user, "DEACTIVATE_CARD", f"MatchRoomMessage #{message.id}", {"content": message.content[:50]})
        return Response({"detail": "Ujumbe umefichwa."})


class AdminMicReactionListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        from mic.models import MicReaction
        from mic.serializers import MicReactionSerializer

        reactions = MicReaction.objects.select_related("user", "match").order_by("-created_at")[:100]
        return Response(MicReactionSerializer(reactions, many=True).data)


class AdminMicReactionToggleActiveView(APIView):
    permission_classes = [IsBashiriAdmin]

    def patch(self, request, reaction_id):
        from mic.models import MicReaction
        from mic.serializers import MicReactionSerializer

        reaction = get_object_or_404(MicReaction, pk=reaction_id)
        reaction.is_active = not reaction.is_active
        reaction.save(update_fields=["is_active"])

        _log_action(
            request.user, "ACTIVATE_CARD" if reaction.is_active else "DEACTIVATE_CARD",
            f"MicReaction #{reaction.id}",
        )
        return Response(MicReactionSerializer(reaction).data)


# ============================================================
# SUPPORT SYSTEM MANAGEMENT
# ============================================================
class AdminSupportTicketListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        from support.models import SupportTicket

        from .serializers import AdminSupportTicketListSerializer

        qs = SupportTicket.objects.select_related("user").order_by("-updated_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        type_filter = request.query_params.get("type")
        if type_filter:
            qs = qs.filter(type=type_filter)

        return Response(AdminSupportTicketListSerializer(qs[:100], many=True).data)


class AdminSupportTicketDetailView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request, ticket_id):
        from support.models import SupportTicket

        from .serializers import AdminSupportTicketDetailSerializer

        ticket = get_object_or_404(SupportTicket.objects.prefetch_related("messages"), pk=ticket_id)
        return Response(AdminSupportTicketDetailSerializer(ticket).data)

    def patch(self, request, ticket_id):
        from support.models import SupportTicket

        from .serializers import AdminSupportTicketDetailSerializer

        ticket = get_object_or_404(SupportTicket, pk=ticket_id)
        new_status = request.data.get("status")
        if new_status in dict(SupportTicket.STATUS_CHOICES):
            ticket.status = new_status
            ticket.save(update_fields=["status", "updated_at"])

        return Response(AdminSupportTicketDetailSerializer(ticket).data)


class AdminSupportTicketReplyView(APIView):
    permission_classes = [IsBashiriAdmin]

    def post(self, request, ticket_id):
        from support.models import SupportMessage, SupportTicket

        from .serializers import AdminSupportTicketDetailSerializer

        ticket = get_object_or_404(SupportTicket, pk=ticket_id)
        content = (request.data.get("content") or "").strip()
        if not content:
            return Response({"detail": "content inahitajika."}, status=status.HTTP_400_BAD_REQUEST)

        SupportMessage.objects.create(ticket=ticket, sender_type="ADMIN", sender=request.user, content=content)

        if ticket.status == "OPEN":
            ticket.status = "IN_PROGRESS"
        ticket.save(update_fields=["status", "updated_at"])

        if ticket.user:
            from notifications.models import Notification

            Notification.objects.create(
                user=ticket.user, type="SUPPORT_REPLY",
                title="Jibu Jipya kwenye Ticket Yako",
                body=content[:100],
                data={"ticket_id": ticket.id},
            )

        _log_action(request.user, "UPDATE_MATCH", f"SupportTicket #{ticket.id} replied")
        return Response(AdminSupportTicketDetailSerializer(ticket).data)


class AdminContentReportListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        from support.models import ContentReport

        from .serializers import AdminContentReportSerializer

        reports = ContentReport.objects.select_related("reporter").order_by("-created_at")[:100]
        return Response(AdminContentReportSerializer(reports, many=True).data)


# ============================================================
# PASSWORD RESET (Support-Assisted, kwa sababu hatuna SMS/Email ya bure)
# ============================================================
class AdminResetUserPasswordView(APIView):
    """
    POST /api/dashboard/users/{id}/reset-password/ — body: {"new_password": "..."}

    Admin ANAWASILIANA na mtumiaji NJE ya app (simu/WhatsApp) kuthibitisha
    utambulisho wake KABLA ya kutumia hii, kisha anamwambia password mpya
    kwa njia ile ile. Ikiwa kuna SupportTicket ya ACCOUNT_ISSUE iliyo wazi
    kwa mtumiaji huyu, tunaifunga kiotomatiki (RESOLVED) na kuongeza ujumbe.
    """
    permission_classes = [IsBashiriAdmin]

    def post(self, request, user_id):
        from .serializers import AdminResetPasswordSerializer

        target_user = get_object_or_404(User, pk=user_id)
        serializer = AdminResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_user.set_password(serializer.validated_data["new_password"])
        target_user.save(update_fields=["password"])

        from support.models import SupportMessage, SupportTicket

        open_ticket = SupportTicket.objects.filter(
            user=target_user, type="ACCOUNT_ISSUE", status__in=["OPEN", "IN_PROGRESS"]
        ).order_by("-updated_at").first()

        if open_ticket:
            SupportMessage.objects.create(
                ticket=open_ticket, sender_type="ADMIN", sender=request.user,
                content="Password yako imebadilishwa na Admin. Tutakupigia/kukutumia ujumbe kukupa password mpya.",
            )
            open_ticket.status = "RESOLVED"
            open_ticket.save(update_fields=["status", "updated_at"])

        _log_action(
            request.user, "MANUAL_SUBSCRIPTION",
            f"Password reset kwa User #{target_user.id} ({target_user.phone_number})",
        )

        return Response({"detail": "Password imebadilishwa. Mjulishe mtumiaji nje ya app."})


# ============================================================
# HERO CAROUSEL MANAGEMENT
# ============================================================
class AdminHeroImageUploadSignatureView(APIView):
    """GET — signature ya kupakia picha ya slide moja kwa moja Cloudinary."""
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        import time

        import cloudinary.utils
        from django.conf import settings as django_settings

        timestamp = int(time.time())
        params_to_sign = {"timestamp": timestamp, "folder": "bashiri/hero-custom"}
        signature = cloudinary.utils.api_sign_request(
            params_to_sign, django_settings.CLOUDINARY_STORAGE["API_SECRET"]
        )

        return Response({
            "signature": signature,
            "timestamp": timestamp,
            "api_key": django_settings.CLOUDINARY_STORAGE["API_KEY"],
            "cloud_name": django_settings.CLOUDINARY_STORAGE["CLOUD_NAME"],
            "folder": "bashiri/hero-custom",
        })


class AdminCustomSlideListView(APIView):
    permission_classes = [IsBashiriAdmin]

    def get(self, request):
        from herocarousel.models import CustomSlide

        from .serializers import AdminCustomSlideSerializer

        slides = CustomSlide.objects.all().order_by("order", "-created_at")
        return Response(AdminCustomSlideSerializer(slides, many=True).data)

    def post(self, request):
        from .serializers import AdminCustomSlideSerializer

        serializer = AdminCustomSlideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        slide = serializer.save()

        _log_action(request.user, "CREATE_HERO_SLIDE", f"CustomSlide #{slide.id}", {"title": slide.title})
        return Response(AdminCustomSlideSerializer(slide).data, status=status.HTTP_201_CREATED)


class AdminCustomSlideDetailView(APIView):
    permission_classes = [IsBashiriAdmin]

    def patch(self, request, slide_id):
        from herocarousel.models import CustomSlide

        from .serializers import AdminCustomSlideSerializer

        slide = get_object_or_404(CustomSlide, pk=slide_id)
        serializer = AdminCustomSlideSerializer(slide, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        _log_action(request.user, "UPDATE_HERO_SLIDE", f"CustomSlide #{slide.id}", request.data)
        return Response(AdminCustomSlideSerializer(slide).data)

    def delete(self, request, slide_id):
        from herocarousel.models import CustomSlide

        slide = get_object_or_404(CustomSlide, pk=slide_id)
        title = slide.title
        slide.delete()

        _log_action(request.user, "DELETE_HERO_SLIDE", f"CustomSlide: {title}")
        return Response(status=status.HTTP_204_NO_CONTENT)
