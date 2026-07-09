"""dashboard/serializers.py"""
from rest_framework import serializers

from accounts.models import User
from feed.models import Card
from payments.models import Subscription, Transaction
from predictions.models import ActiveDerby, League, Match, Team
from support.models import ContentReport, SupportMessage, SupportTicket

from .models import AdminActionLog


class AdminLoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField()


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "phone_number", "username", "avatar_url", "is_active", "is_staff",
            "is_subscriber", "is_subscription_active", "total_predictions",
            "correct_predictions", "accuracy_percentage", "date_joined",
        ]


class AdminUserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "phone_number", "username", "avatar_url", "date_of_birth", "is_active",
            "is_staff", "is_subscriber", "is_subscription_active",
            "subscription_expires_at", "current_streak", "best_streak",
            "total_predictions", "correct_predictions", "accuracy_percentage",
            "preferred_language", "date_joined",
        ]


class AdminMatchSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(source="home_team.name", read_only=True)
    away_team_name = serializers.CharField(source="away_team.name", read_only=True)
    league_name = serializers.CharField(source="league.name", read_only=True)

    class Meta:
        model = Match
        fields = [
            "id", "external_id", "league", "league_name", "home_team", "home_team_name",
            "away_team", "away_team_name", "kickoff_at", "matchday", "status",
            "home_score", "away_score", "is_big_match", "created_at",
        ]
        read_only_fields = ["id", "external_id", "created_at"]


class AdminLeagueSerializer(serializers.ModelSerializer):
    team_count = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = ["id", "code", "name", "poisson_key", "is_active", "team_count"]

    def get_team_count(self, obj):
        return obj.teams.count()


class AdminTeamSerializer(serializers.ModelSerializer):
    league_name = serializers.CharField(source="league.name", read_only=True)

    class Meta:
        model = Team
        fields = ["id", "name", "league", "league_name", "crest_url"]


class AdminTransactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    avatar_url = serializers.CharField(source="user.avatar_url", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id", "user", "username", "avatar_url", "plan", "amount_tzs", "phone_number",
            "checkout_request_id", "status", "mpesa_receipt_number",
            "result_desc", "created_at",
        ]
        read_only_fields = fields


class AdminSubscriptionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Subscription
        fields = ["id", "user", "username", "plan", "amount_tzs", "starts_at", "ends_at", "is_active"]


class AdminCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ["id", "type", "match_id", "data", "is_active", "created_at"]


class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source="admin_user.username", read_only=True)

    class Meta:
        model = AdminActionLog
        fields = ["id", "admin_username", "action", "target_description", "details", "created_at"]
        read_only_fields = fields


class AdminActiveDerbySerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(source="home_team.name", read_only=True)
    away_team_name = serializers.CharField(source="away_team.name", read_only=True)

    class Meta:
        model = ActiveDerby
        fields = [
            "id", "home_team", "home_team_name", "away_team", "away_team_name",
            "match", "derby_name", "starts_at", "ends_at", "theme_accent_color",
            "banner_text", "is_active", "created_at",
        ]


class AdminSupportMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = ["id", "sender_type", "sender_username", "content", "created_at"]
        read_only_fields = fields

    def get_sender_username(self, obj):
        return obj.sender.username if obj.sender else None


class AdminSupportTicketListSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            "id", "user", "user_username", "guest_phone", "guest_name", "type",
            "subject", "status", "related_content_type", "related_object_id",
            "created_at", "updated_at",
        ]

    def get_user_username(self, obj):
        return obj.user.username if obj.user else None


class AdminSupportTicketDetailSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()
    messages = AdminSupportMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            "id", "user", "user_username", "guest_phone", "guest_name", "type",
            "subject", "status", "related_content_type", "related_object_id",
            "created_at", "updated_at", "messages",
        ]

    def get_user_username(self, obj):
        return obj.user.username if obj.user else None


class AdminContentReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source="reporter.username", read_only=True)

    class Meta:
        model = ContentReport
        fields = ["id", "reporter", "reporter_username", "content_type", "object_id", "reason", "note", "created_at"]
