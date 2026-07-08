from django.contrib import admin
from .models import Subscription, Transaction


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "plan", "amount_tzs", "starts_at", "ends_at", "is_active"]
    list_filter = ["plan", "is_active"]
    search_fields = ["user__phone_number", "user__username"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["user", "plan", "amount_tzs", "status", "mpesa_receipt_number", "created_at"]
    list_filter = ["status", "plan"]
    search_fields = ["user__phone_number", "checkout_request_id", "mpesa_receipt_number"]
