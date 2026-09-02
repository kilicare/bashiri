"""
feed/models.py

Card types 8 — zinaendana EXACTLY na settings.BASHIRI["FEED_CARD_SCORES"]
keys (Phase 0). is_big_match SI card type tofauti — ni bonus ya ranking
(angalia ranking.py).
"""
from django.conf import settings
from django.db import models

CARD_TYPES = [
    ("AI_PICK", "AI Pick"),
    ("LIVE_MATCH", "Live Match"),
    ("RESULT_RECAP", "Result Recap"),
    ("AI_WEEKLY_REPORT", "AI Weekly Report"),
    ("STAT", "Stat/Insight"),
    ("POLL", "Poll/Vote"),
    ("MILESTONE", "Milestone"),
    ("DID_YOU_KNOW", "Did You Know"),
    ("DEBATE", "Debate"),
    ("MIC_WINNER", "Mic Winner"),
    ("BEST_STREAK_USER", "Best Streak User"),
]


class Card(models.Model):
    type = models.CharField(max_length=20, choices=CARD_TYPES, db_index=True)
    match = models.ForeignKey(
        "predictions.Match", on_delete=models.CASCADE, null=True, blank=True, related_name="cards"
    )
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "feed_card"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} card ({self.pk})"


class PollVote(models.Model):
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="poll_votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="poll_votes")
    choice = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "feed_pollvote"
        unique_together = ["card", "user"]

    def __str__(self):
        return f"{self.user} voted {self.choice}"
