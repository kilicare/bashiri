"""matchroom/models.py"""
from django.conf import settings
from django.db import models


class MatchRoomMessage(models.Model):
    match = models.ForeignKey(
        "predictions.Match", on_delete=models.CASCADE, related_name="room_messages"
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="room_messages")
    content = models.CharField(max_length=200)
    is_hidden = models.BooleanField(default=False, help_text="Admin anaweza kuficha ujumbe usiofaa")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "matchroom_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user}: {self.content[:30]}"