from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    ROLE_CHOICES = [("user", "User"), ("assistant", "Assistant")]
    FEEDBACK_CHOICES = [(None, "None"), ("positive", "Positive"), ("negative", "Negative")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="chat_messages")
    session_key = models.CharField(max_length=64, blank=True, default="", help_text="Kwa guest bila account")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    feedback = models.CharField(max_length=10, choices=FEEDBACK_CHOICES, null=True, blank=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_message"
        ordering = ["created_at"]


class ChatUsage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="chat_usage")
    session_key = models.CharField(max_length=64, blank=True, default="")
    date = models.DateField(auto_now_add=True)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "chat_usage"
        unique_together = ["user", "session_key", "date"]
