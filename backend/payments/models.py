"""
payments/models.py

Subscription — rekodi ya kila kipindi cha malipo kilichofanikiwa.
Transaction — rekodi ya kila jaribio la STK Push (PENDING hadi litakapoamuliwa).
"""
from django.conf import settings
from django.db import models

PLAN_CHOICES = [("weekly", "Weekly"), ("monthly", "Monthly")]


class Subscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.CharField(max_length=10, choices=PLAN_CHOICES)
    amount_tzs = models.PositiveIntegerField()
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments_subscription"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.plan} (hadi {self.ends_at:%Y-%m-%d})"


class Transaction(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions")
    plan = models.CharField(max_length=10, choices=PLAN_CHOICES)
    amount_tzs = models.PositiveIntegerField()
    phone_number = models.CharField(max_length=20)
    merchant_request_id = models.CharField(max_length=100, blank=True, default="")
    checkout_request_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="PENDING")
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, default="")
    result_desc = models.CharField(max_length=255, blank=True, default="")
    # Tigo Pesa fields
    tigo_transaction_ref_id = models.CharField(max_length=100, blank=True, default="")
    tigo_redirect_url = models.URLField(max_length=500, blank=True, default="")
    tigo_auth_code = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments_transaction"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.plan} ({self.status})"
