"""
dashboard/models.py

AdminActionLog — audit trail ya kila kitendo cha admin (ban user,
activate subscription kwa mkono, deactivate card, n.k.) — muhimu
kisheria na kwa uwazi wa timu ya admin baadaye.
"""
from django.conf import settings
from django.db import models


class AdminActionLog(models.Model):
    ACTION_CHOICES = [
        ("BAN_USER", "Ban User"),
        ("UNBAN_USER", "Unban User"),
        ("MANUAL_SUBSCRIPTION", "Manual Subscription Activation"),
        ("DEACTIVATE_CARD", "Deactivate Card"),
        ("ACTIVATE_CARD", "Activate Card"),
        ("TOGGLE_BIG_MATCH", "Toggle Big Match"),
        ("BROADCAST_NOTIFICATION", "Broadcast Notification"),
        ("CREATE_MATCH", "Create Match"),
        ("UPDATE_MATCH", "Update Match"),
        ("MAKE_ADMIN", "Make Admin"),
        ("REVOKE_ADMIN", "Revoke Admin"),
    ]

    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="admin_actions"
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    target_description = models.CharField(max_length=255, help_text="mfano: 'User #42 (+255712345678)'")
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dashboard_adminactionlog"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.admin_user} — {self.action} — {self.target_description}"
