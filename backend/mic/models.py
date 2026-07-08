"""
mic/models.py

Bashiri Mic — video reactions za mashabiki (sekunde 15-20), zilizowekwa
Cloudinary. Posting window: kutoka Full Time hadi masaa 24 baada ya FT.
"""
from django.conf import settings
from django.db import models

MOOD_CHOICES = [
    ("FUNNY", "😂 Funny"),
    ("FIRE", "🔥 Fire"),
    ("ANGRY", "😡 Angry"),
    ("RESPECT", "👏 Respect"),
    ("SHOCK", "🤯 Shock"),
    ("PAIN", "💔 Pain"),
]

TEAM_SIDE_CHOICES = [
    ("HOME", "Home Team Fan"),
    ("AWAY", "Away Team Fan"),
    ("NEUTRAL", "Neutral"),
]

REACTION_EMOJI_CHOICES = [
    ("LAUGH", "😂"), ("FIRE", "🔥"), ("CLAP", "👏"), ("HUNDRED", "💯"), ("ROFL", "🤣"),
]


class MicReaction(models.Model):
    match = models.ForeignKey("predictions.Match", on_delete=models.CASCADE, related_name="mic_reactions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mic_reactions")
    video_url = models.URLField(max_length=500)
    thumbnail_url = models.URLField(max_length=500, blank=True, default="")
    duration_seconds = models.PositiveSmallIntegerField()
    mood = models.CharField(max_length=10, choices=MOOD_CHOICES)
    team_side = models.CharField(max_length=10, choices=TEAM_SIDE_CHOICES, default="NEUTRAL")
    is_active = models.BooleanField(default=True, help_text="Admin anaweza kuzima video isiyofaa")
    is_fan_of_match = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "mic_reaction"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.mood} ({self.match})"


class MicReactionVote(models.Model):
    mic_reaction = models.ForeignKey(MicReaction, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mic_votes")
    emoji = models.CharField(max_length=10, choices=REACTION_EMOJI_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "mic_reactionvote"
        unique_together = ["mic_reaction", "user"]

    def __str__(self):
        return f"{self.user} reacted {self.emoji}"