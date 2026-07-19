"""
support/models.py

SupportTicket — "inbox" moja kwa aina zote za mawasiliano: tatizo la
akaunti, malipo, ripoti ya maudhui, hitilafu, maoni. SupportMessage ni
"thread" ya ndani ya ticket (kama chat), kati ya mtumiaji na admin.

ContentReport — ripoti ya maudhui maalum (video ya Mic, User Prediction
Card, ujumbe wa Match Room). Ikiwa watumiaji tofauti 3+ wameripoti kitu
kile kile, kinajifunga (auto-hide) na SupportTicket inaundwa kiotomatiki
kwa admin kukagua.
"""
from django.conf import settings
from django.db import models


class SupportTicket(models.Model):
    TYPE_CHOICES = [
        ("ACCOUNT_ISSUE", "Tatizo la Akaunti"),
        ("PAYMENT_ISSUE", "Tatizo la Malipo"),
        ("CONTENT_REPORT", "Ripoti ya Maudhui"),
        ("BUG_REPORT", "Hitilafu ya App"),
        ("FEEDBACK", "Maoni"),
        ("OTHER", "Nyingine"),
    ]
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("CLOSED", "Closed"),
    ]
    CONTENT_TYPE_CHOICES = [
        ("MIC_REACTION", "Bashiri Mic Video"),
        ("ROOM_MESSAGE", "Match Room Message"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="support_tickets"
    )
    guest_phone = models.CharField(max_length=20, blank=True, default="")
    guest_name = models.CharField(max_length=100, blank=True, default="")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    subject = models.CharField(max_length=150)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="OPEN")
    related_content_type = models.CharField(max_length=25, choices=CONTENT_TYPE_CHOICES, blank=True, default="")
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "support_ticket"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"#{self.id} — {self.subject} ({self.status})"


class SupportMessage(models.Model):
    SENDER_CHOICES = [("USER", "User"), ("ADMIN", "Admin")]

    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="messages")
    sender_type = models.CharField(max_length=6, choices=SENDER_CHOICES)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="support_messages"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "support_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender_type}: {self.content[:40]}"


class ContentReport(models.Model):
    REASON_CHOICES = [
        ("ABUSIVE", "Matusi"),
        ("INAPPROPRIATE", "Maudhui Yasiyofaa"),
        ("SPAM", "Spam"),
        ("OTHER", "Nyingine"),
    ]

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="content_reports")
    content_type = models.CharField(max_length=25, choices=SupportTicket.CONTENT_TYPE_CHOICES)
    object_id = models.PositiveIntegerField()
    reason = models.CharField(max_length=15, choices=REASON_CHOICES)
    note = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "support_contentreport"
        unique_together = ["reporter", "content_type", "object_id"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reporter} reported {self.content_type}#{self.object_id}"
