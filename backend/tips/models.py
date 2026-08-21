from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Count, Q
import logging

logger = logging.getLogger(__name__)


class UserTip(models.Model):
    """User-generated football prediction tips"""
    
    STATUS_CHOICES = [
        ("PENDING", "Pending"),        # Match not yet played
        ("CORRECT", "Correct"),        # Prediction was right
        ("INCORRECT", "Incorrect"),    # Prediction was wrong
        ("VOID", "Void"),              # Match postponed/cancelled
    ]
    
    VISIBILITY_CHOICES = [
        ("PUBLIC", "Public"),              # Visible to all users
        ("FOLLOWERS", "Followers Only"),   # Followers only
        ("PRIVATE", "Private"),            # Only tipster
    ]
    
    # Core relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tips",
        help_text="User who created this tip"
    )
    match = models.ForeignKey(
        "predictions.Match",
        on_delete=models.CASCADE,
        related_name="tips",
        help_text="Match this tip is for"
    )
    
    # Prediction details
    market_key = models.CharField(
        max_length=50,
        help_text="e.g., '1X2', 'OVER_UNDER_2_5', 'BTTS', 'DRAW_NO_BET'"
    )
    selection = models.CharField(
        max_length=50,
        help_text="e.g., 'home_win', 'over_2.5', 'both_teams_score_yes'"
    )
    confidence = models.PositiveSmallIntegerField(
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="User confidence 0-100%"
    )
    reasoning = models.TextField(
        blank=True,
        default="",
        help_text="User's analysis or reasoning for this tip"
    )
    
    # Status & visibility
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING",
        db_index=True
    )
    visibility = models.CharField(
        max_length=10,
        choices=VISIBILITY_CHOICES,
        default="PUBLIC",
        db_index=True
    )
    
    # Engagement metrics
    views_count = models.PositiveIntegerField(default=0, db_index=True)
    upvotes_count = models.PositiveIntegerField(default=0)
    downvotes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "tips_usertip"
        ordering = ["-created_at"]
        verbose_name = "User Tip"
        verbose_name_plural = "User Tips"
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["match", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["visibility", "-created_at"]),
            models.Index(fields=["market_key", "-created_at"]),
            models.Index(fields=["views_count", "-created_at"]),
            models.Index(fields=["upvotes_count", "-created_at"]),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.match.id} ({self.status})"
    
    def get_market_label(self):
        """Get human-readable market label"""
        labels = {
            "1X2": "Win/Draw/Loss",
            "DRAW_NO_BET": "Draw No Bet",
            "OVER_UNDER_0_5": "Over/Under 0.5",
            "OVER_UNDER_1_5": "Over/Under 1.5",
            "OVER_UNDER_2_5": "Over/Under 2.5",
            "OVER_UNDER_3_5": "Over/Under 3.5",
            "OVER_UNDER_4_5": "Over/Under 4.5",
            "BTTS": "Both Teams To Score",
            "DOUBLE_CHANCE": "Double Chance",
            "CORRECT_SCORE": "Correct Score",
        }
        return labels.get(self.market_key, self.market_key)
    
    def get_selection_label(self):
        """Get human-readable selection label"""
        labels = {
            "home_win": "Home Win",
            "draw": "Draw",
            "away_win": "Away Win",
            "home_win_or_draw": "Home Win or Draw",
            "draw_or_away_win": "Draw or Away Win",
            "home_win_or_away_win": "Either Wins",
            "over_0_5": "Over 0.5",
            "under_0_5": "Under 0.5",
            "over_1_5": "Over 1.5",
            "under_1_5": "Under 1.5",
            "over_2_5": "Over 2.5",
            "under_2_5": "Under 2.5",
            "over_3_5": "Over 3.5",
            "under_3_5": "Under 3.5",
            "over_4_5": "Over 4.5",
            "under_4_5": "Under 4.5",
            "both_teams_score_yes": "Both Score",
            "both_teams_score_no": "One Team Doesn't Score",
        }
        return labels.get(self.selection, self.selection)
    
    @property
    def net_votes(self):
        """Calculate net votes (upvotes - downvotes)"""
        return self.upvotes_count - self.downvotes_count
    
    @property
    def engagement_score(self):
        """Calculate engagement score for sorting"""
        return (
            (self.views_count * 0.1) +
            (self.upvotes_count * 0.5) +
            (self.comments_count * 0.3)
        )


class TipPerformance(models.Model):
    """Track tip accuracy statistics per user"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tip_performance"
    )
    
    # Overall stats
    total_tips = models.PositiveIntegerField(default=0, db_index=True)
    correct_tips = models.PositiveIntegerField(default=0)
    incorrect_tips = models.PositiveIntegerField(default=0)
    void_tips = models.PositiveIntegerField(default=0)
    accuracy_percentage = models.FloatField(default=0.0, db_index=True)
    
    # Market-specific stats
    tips_1x2 = models.PositiveIntegerField(default=0)
    correct_1x2 = models.PositiveIntegerField(default=0)
    accuracy_1x2 = models.FloatField(default=0.0)
    
    tips_btts = models.PositiveIntegerField(default=0)
    correct_btts = models.PositiveIntegerField(default=0)
    accuracy_btts = models.FloatField(default=0.0)
    
    tips_over_under = models.PositiveIntegerField(default=0)
    correct_over_under = models.PositiveIntegerField(default=0)
    accuracy_over_under = models.FloatField(default=0.0)
    
    tips_double_chance = models.PositiveIntegerField(default=0)
    correct_double_chance = models.PositiveIntegerField(default=0)
    accuracy_double_chance = models.FloatField(default=0.0)
    
    # Streak tracking
    current_streak = models.PositiveSmallIntegerField(default=0)
    best_streak = models.PositiveSmallIntegerField(default=0)
    
    # Social proof
    followers_count = models.PositiveIntegerField(default=0)
    total_upvotes_received = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "tips_tipperformance"
        verbose_name = "Tip Performance"
        verbose_name_plural = "Tip Performances"
    
    def __str__(self):
        return f"{self.user.username} - {self.accuracy_percentage}% ({self.total_tips} tips)"
    
    def calculate_accuracy(self):
        """Recalculate all accuracy percentages"""
        # Overall accuracy
        if self.total_tips > 0:
            self.accuracy_percentage = round(
                (self.correct_tips / self.total_tips) * 100, 1
            )
        else:
            self.accuracy_percentage = 0.0
        
        # Market-specific accuracies
        if self.tips_1x2 > 0:
            self.accuracy_1x2 = round(
                (self.correct_1x2 / self.tips_1x2) * 100, 1
            )
        else:
            self.accuracy_1x2 = 0.0
        
        if self.tips_btts > 0:
            self.accuracy_btts = round(
                (self.correct_btts / self.tips_btts) * 100, 1
            )
        else:
            self.accuracy_btts = 0.0
        
        if self.tips_over_under > 0:
            self.accuracy_over_under = round(
                (self.correct_over_under / self.tips_over_under) * 100, 1
            )
        else:
            self.accuracy_over_under = 0.0
        
        if self.tips_double_chance > 0:
            self.accuracy_double_chance = round(
                (self.correct_double_chance / self.tips_double_chance) * 100, 1
            )
        else:
            self.accuracy_double_chance = 0.0
        
        self.save(update_fields=[
            "accuracy_percentage",
            "accuracy_1x2",
            "accuracy_btts",
            "accuracy_over_under",
            "accuracy_double_chance"
        ])
    
    def update_streak(self, is_correct):
        """Update streak based on tip result"""
        if is_correct:
            self.current_streak += 1
            if self.current_streak > self.best_streak:
                self.best_streak = self.current_streak
        else:
            self.current_streak = 0
        self.save(update_fields=["current_streak", "best_streak"])


class TipComment(models.Model):
    """Comments on user tips"""
    
    tip = models.ForeignKey(
        UserTip,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tip_comments"
    )
    content = models.TextField(max_length=500)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "tips_tipcomment"
        ordering = ["-created_at"]
        verbose_name = "Tip Comment"
        verbose_name_plural = "Tip Comments"
        indexes = [
            models.Index(fields=["tip", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["parent", "-created_at"]),
        ]
    
    def __str__(self):
        return f"{self.user.username} on tip {self.tip.id}"
    
    def save(self, *args, **kwargs):
        """Update parent tip comment count"""
        super().save(*args, **kwargs)
        
        # Update tip comment count
        self.tip.comments_count = self.tip.comments.count()
        self.tip.save(update_fields=["comments_count"])


class TipVote(models.Model):
    """Upvotes/downvotes on tips"""
    
    VOTE_CHOICES = [
        ("UP", "Upvote"),
        ("DOWN", "Downvote"),
    ]
    
    tip = models.ForeignKey(
        UserTip,
        on_delete=models.CASCADE,
        related_name="votes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tip_votes"
    )
    vote = models.CharField(max_length=4, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "tips_tipvote"
        unique_together = ["tip", "user"]
        verbose_name = "Tip Vote"
        verbose_name_plural = "Tip Votes"
        indexes = [
            models.Index(fields=["tip", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.vote} on tip {self.tip.id}"


class TipShare(models.Model):
    """Track when users share tips"""
    
    tip = models.ForeignKey(
        UserTip,
        on_delete=models.CASCADE,
        related_name="shares"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tip_shares",
        null=True,
        blank=True
    )
    shared_to = models.CharField(
        max_length=20,
        choices=[
            ("WHATSAPP", "WhatsApp"),
            ("TWITTER", "Twitter"),
            ("FACEBOOK", "Facebook"),
            ("COPY", "Copy Link"),
            ("SMS", "SMS"),
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "tips_tipshare"
        verbose_name = "Tip Share"
        verbose_name_plural = "Tip Shares"
        indexes = [
            models.Index(fields=["tip", "-created_at"]),
        ]
    
    def __str__(self):
        return f"Tip {self.tip.id} shared to {self.shared_to}"