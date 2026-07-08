from rest_framework import serializers
from .models import Subscription, Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id", "plan", "amount_tzs", "phone_number", "checkout_request_id",
            "status", "mpesa_receipt_number", "result_desc", "created_at",
        ]
        read_only_fields = fields


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["id", "plan", "amount_tzs", "starts_at", "ends_at", "is_active", "created_at"]
        read_only_fields = fields