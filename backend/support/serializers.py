"""support/serializers.py"""
from rest_framework import serializers

from accounts.serializers import normalize_tz_phone

from .models import ContentReport, SupportMessage, SupportTicket


class SupportMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = ["id", "sender_type", "sender_username", "content", "created_at"]
        read_only_fields = fields

    def get_sender_username(self, obj):
        return obj.sender.username if obj.sender else None


class SupportTicketListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ["id", "type", "subject", "status", "created_at", "updated_at"]
        read_only_fields = fields


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            "id", "type", "subject", "status", "related_content_type",
            "related_object_id", "created_at", "updated_at", "messages",
        ]
        read_only_fields = fields


class CreateSupportTicketSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=SupportTicket.TYPE_CHOICES)
    subject = serializers.CharField(max_length=150)
    message = serializers.CharField()
    guest_phone = serializers.CharField(required=False, allow_blank=True)
    guest_name = serializers.CharField(required=False, allow_blank=True, max_length=100)

    def validate_guest_phone(self, value):
        if not value:
            return value
        return normalize_tz_phone(value)

    def validate(self, attrs):
        request = self.context["request"]
        if not request.user.is_authenticated and not attrs.get("guest_phone"):
            raise serializers.ValidationError({"guest_phone": "Namba ya simu inahitajika kwa guest."})
        return attrs


class ContentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentReport
        fields = ["id", "content_type", "object_id", "reason", "note", "created_at"]
        read_only_fields = ["id", "created_at"]
