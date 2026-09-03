from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Count, Q
import logging

from .market_registry import (
    get_market_definition,
    get_selection_label as get_selection_label_from_registry,
)

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
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this tip is still active/visible in main feed"
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
    locked_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
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
        """Get human-readable market label from centralized registry"""
        market = get_market_definition(self.market_key)
        if market:
            return market["label"]
        return self.market_key
    
    def get_selection_label(self):
        """Get human-readable selection label from centralized registry"""
        return get_selection_label_from_registry(self.market_key, self.selection) or self.selection
    
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
    
    @property
    def is_locked(self):
        """Check if tip is locked (at match kickoff)"""
        if self.locked_at:
            return True
        if self.match.kickoff_at and timezone.now() >= self.match.kickoff_at:
            return True
        return False
    
    def lock(self):
        """Lock the tip at match kickoff"""
        if not self.locked_at:
            self.locked_at = timezone.now()
            self.save(update_fields=['locked_at'])


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
    
    tips_dnb = models.PositiveIntegerField(default=0)
    correct_dnb = models.PositiveIntegerField(default=0)
    accuracy_dnb = models.FloatField(default=0.0)
    
    # League-specific stats (for top leagues)
    tips_epl = models.PositiveIntegerField(default=0)
    correct_epl = models.PositiveIntegerField(default=0)
    accuracy_epl = models.FloatField(default=0.0)
    
    tips_laliga = models.PositiveIntegerField(default=0)
    correct_laliga = models.PositiveIntegerField(default=0)
    accuracy_laliga = models.FloatField(default=0.0)
    
    tips_seriea = models.PositiveIntegerField(default=0)
    correct_seriea = models.PositiveIntegerField(default=0)
    accuracy_seriea = models.FloatField(default=0.0)
    
    tips_bundesliga = models.PositiveIntegerField(default=0)
    correct_bundesliga = models.PositiveIntegerField(default=0)
    accuracy_bundesliga = models.FloatField(default=0.0)
    
    tips_ligue1 = models.PositiveIntegerField(default=0)
    correct_ligue1 = models.PositiveIntegerField(default=0)
    accuracy_ligue1 = models.FloatField(default=0.0)
    
    # Tipster Score (calculated using versioned formula)
    tipster_score = models.PositiveSmallIntegerField(default=0, db_index=True)
    tipster_score_version = models.CharField(max_length=20, default="v1.0")
    
    # Streak tracking
    current_streak = models.PositiveSmallIntegerField(default=0)
    best_streak = models.PositiveSmallIntegerField(default=0)
    
    # Recent form (last 10 tips)
    recent_form_tips = models.PositiveSmallIntegerField(default=0)
    recent_form_correct = models.PositiveSmallIntegerField(default=0)
    
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
        # Overall accuracy (only settled tips: CORRECT + INCORRECT)
        settled_count = self.correct_tips + self.incorrect_tips
        if settled_count > 0:
            self.accuracy_percentage = round(
                (self.correct_tips / settled_count) * 100, 1
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
        
        if self.tips_dnb > 0:
            self.accuracy_dnb = round(
                (self.correct_dnb / self.tips_dnb) * 100, 1
            )
        else:
            self.accuracy_dnb = 0.0
        
        # League-specific accuracies
        if self.tips_epl > 0:
            self.accuracy_epl = round(
                (self.correct_epl / self.tips_epl) * 100, 1
            )
        else:
            self.accuracy_epl = 0.0
        
        if self.tips_laliga > 0:
            self.accuracy_laliga = round(
                (self.correct_laliga / self.tips_laliga) * 100, 1
            )
        else:
            self.accuracy_laliga = 0.0
        
        if self.tips_seriea > 0:
            self.accuracy_seriea = round(
                (self.correct_seriea / self.tips_seriea) * 100, 1
            )
        else:
            self.accuracy_seriea = 0.0
        
        if self.tips_bundesliga > 0:
            self.accuracy_bundesliga = round(
                (self.correct_bundesliga / self.tips_bundesliga) * 100, 1
            )
        else:
            self.accuracy_bundesliga = 0.0
        
        if self.tips_ligue1 > 0:
            self.accuracy_ligue1 = round(
                (self.correct_ligue1 / self.tips_ligue1) * 100, 1
            )
        else:
            self.accuracy_ligue1 = 0.0
        
        self.save(update_fields=[
            "accuracy_percentage",
            "accuracy_1x2",
            "accuracy_btts",
            "accuracy_over_under",
            "accuracy_double_chance",
            "accuracy_dnb",
            "accuracy_epl",
            "accuracy_laliga",
            "accuracy_seriea",
            "accuracy_bundesliga",
            "accuracy_ligue1"
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
    
    def update_recent_form(self, is_correct):
        """Update recent form (last 10 tips)"""
        self.recent_form_tips += 1
        if is_correct:
            self.recent_form_correct += 1
        
        # Keep only last 10 tips
        if self.recent_form_tips > 10:
            self.recent_form_tips = 10
            # Simplified: just decrement proportionally
            # In production, would use a proper FIFO queue
            self.recent_form_correct = min(self.recent_form_correct, 10)
        
        self.save(update_fields=["recent_form_tips", "recent_form_correct"])
    
    def get_recent_form_percentage(self):
        """Get recent form as percentage"""
        if self.recent_form_tips == 0:
            return None
        return round((self.recent_form_correct / self.recent_form_tips) * 100, 1)
    
    def get_market_specialization(self):
        """
        Get market specialization (best performing market with sufficient sample size).
        
        Returns None if no market has sufficient sample size (min 10 tips).
        """
        MIN_SAMPLE_SIZE = 10
        
        specializations = []
        
        if self.tips_1x2 >= MIN_SAMPLE_SIZE:
            specializations.append(("1X2", self.accuracy_1x2, self.tips_1x2))
        if self.tips_btts >= MIN_SAMPLE_SIZE:
            specializations.append(("BTTS", self.accuracy_btts, self.tips_btts))
        if self.tips_over_under >= MIN_SAMPLE_SIZE:
            specializations.append(("Goals", self.accuracy_over_under, self.tips_over_under))
        if self.tips_double_chance >= MIN_SAMPLE_SIZE:
            specializations.append(("Double Chance", self.accuracy_double_chance, self.tips_double_chance))
        if self.tips_dnb >= MIN_SAMPLE_SIZE:
            specializations.append(("DNB", self.accuracy_dnb, self.tips_dnb))
        
        if not specializations:
            return None
        
        # Return best performing market
        best = max(specializations, key=lambda x: x[1])
        return {
            "market": best[0],
            "accuracy": best[1],
            "sample_size": best[2]
        }
    
    def get_league_specialization(self):
        """
        Get league specialization (best performing league with sufficient sample size).
        
        Returns None if no league has sufficient sample size (min 10 tips).
        """
        MIN_SAMPLE_SIZE = 10
        
        league_map = {
            "tips_epl": ("EPL", self.accuracy_epl, self.tips_epl),
            "tips_laliga": ("LaLiga", self.accuracy_laliga, self.tips_laliga),
            "tips_seriea": ("Serie A", self.accuracy_seriea, self.tips_seriea),
            "tips_bundesliga": ("Bundesliga", self.accuracy_bundesliga, self.tips_bundesliga),
            "tips_ligue1": ("Ligue 1", self.accuracy_ligue1, self.tips_ligue1),
        }
        
        specializations = []
        
        for field_name, (league_name, accuracy, tips_count) in league_map.items():
            if tips_count >= MIN_SAMPLE_SIZE:
                specializations.append((league_name, accuracy, tips_count))
        
        if not specializations:
            return None
        
        # Return best performing league
        best = max(specializations, key=lambda x: x[1])
        return {
            "league": best[0],
            "accuracy": best[1],
            "sample_size": best[2]
        }
    
    def calculate_tipster_score(self):
        """
        Calculate tipster score using versioned formula.
        
        Version 1.0 Formula:
        - Base score from accuracy (0-100)
        - Sample size adjustment (using Wilson interval logic)
        - Recent form bonus
        - Streak bonus
        - Market diversity bonus
        
        This is designed to avoid statistical overconfidence from tiny samples.
        """
        # Only calculate if we have minimum sample size
        MIN_TIPS_FOR_SCORE = 10
        if self.total_tips < MIN_TIPS_FOR_SCORE:
            self.tipster_score = 0
            self.save(update_fields=["tipster_score"])
            return
        
        # Base score from accuracy
        base_score = self.accuracy_percentage
        
        # Sample size adjustment using Wilson interval logic
        # This penalizes tiny samples while converging to true accuracy for large samples
        n = self.total_tips
        p = self.accuracy_percentage / 100.0
        
        # Wilson interval lower bound (conservative estimate)
        # z = 1.96 for 95% confidence
        z = 1.96
        wilson_lower = (p + (z*z)/(2*n) - z * ((p*(1-p) + (z*z)/(4*n))/n)**0.5) / (1 + (z*z)/n)
        
        # Convert to 0-100 scale
        sample_adjusted_score = max(0, min(100, wilson_lower * 100))
        
        # Recent form bonus (last 10 tips)
        recent_form_percentage = self.get_recent_form_percentage()
        if recent_form_percentage is not None:
            # Bonus if recent form is better than overall accuracy
            if recent_form_percentage > self.accuracy_percentage:
                form_bonus = min(5, (recent_form_percentage - self.accuracy_percentage) / 2)
            else:
                form_bonus = 0
        else:
            form_bonus = 0
        
        # Streak bonus
        streak_bonus = min(5, self.current_streak * 0.5)
        
        # Market diversity bonus (measures expertise across multiple markets)
        market_diversity = 0
        if self.tips_1x2 >= 5: market_diversity += 1
        if self.tips_btts >= 5: market_diversity += 1
        if self.tips_over_under >= 5: market_diversity += 1
        if self.tips_double_chance >= 5: market_diversity += 1
        if self.tips_dnb >= 5: market_diversity += 1
        diversity_bonus = min(3, market_diversity)
        
        # Calculate final score
        final_score = sample_adjusted_score + form_bonus + streak_bonus + diversity_bonus
        
        # Clamp to 0-100
        self.tipster_score = max(0, min(100, round(final_score)))
        self.tipster_score_version = "v1.0"
        
        self.save(update_fields=["tipster_score", "tipster_score_version"])


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


class TipAISnapshot(models.Model):
    """
    Immutable snapshot of AI prediction data at tip creation time.
    
    This ensures historical tips remain accurate even when the model
    is retrained and probabilities change.
    """
    
    tip = models.OneToOneField(
        UserTip,
        on_delete=models.CASCADE,
        related_name="ai_snapshot"
    )
    
    # Model metadata
    model_version = models.CharField(
        max_length=50,
        help_text="Version of the model used for this prediction"
    )
    prediction_generated_at = models.DateTimeField(
        help_text="When the prediction was generated"
    )
    
    # Prediction data
    market_key = models.CharField(
        max_length=50,
        help_text="Market key from prediction"
    )
    selection_key = models.CharField(
        max_length=50,
        help_text="Selection key from prediction"
    )
    raw_probability = models.FloatField(
        null=True,
        blank=True,
        help_text="Raw model probability (0-1)"
    )
    calibrated_probability = models.FloatField(
        null=True,
        blank=True,
        help_text="Calibrated probability if available (0-1)"
    )
    
    # Recommendation data
    recommendation_tier = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="STRONG, ELITE, or NO_STRONG_PICK"
    )
    data_quality = models.FloatField(
        null=True,
        blank=True,
        help_text="Data quality score (0-1)"
    )
    confidence_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Confidence score (0-1)"
    )
    
    # AI agreement
    ai_agrees = models.BooleanField(
        default=False,
        help_text="Whether tip selection matches AI recommendation"
    )
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "tips_taisnapshot"
        verbose_name = "Tip AI Snapshot"
        verbose_name_plural = "Tip AI Snapshots"
    
    def __str__(self):
        return f"Tip {self.tip.id} AI Snapshot (v{self.model_version})"


class TipSlip(models.Model):
    """
    Multi-match tip slip (accumulator).
    
    Groups multiple independent tips from different matches into one slip.
    Each leg is independently verifiable.
    """
    
    STATUS_CHOICES = [
        ("PENDING", "Pending"),        # Not all legs verified
        ("WON", "Won"),                # All legs won
        ("LOST", "Lost"),              # At least one leg lost
        ("VOID", "Void"),              # All legs void or mixed void with no loss
    ]
    
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tip_slips"
    )
    
    # Status
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING",
        db_index=True
    )
    
    # Stats
    total_legs = models.PositiveSmallIntegerField(default=0)
    won_legs = models.PositiveSmallIntegerField(default=0)
    lost_legs = models.PositiveSmallIntegerField(default=0)
    void_legs = models.PositiveSmallIntegerField(default=0)
    
    # Engagement
    views_count = models.PositiveIntegerField(default=0)
    upvotes_count = models.PositiveIntegerField(default=0)
    downvotes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "tips_tipslip"
        verbose_name = "Tip Slip"
        verbose_name_plural = "Tip Slips"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["creator", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
        ]
    
    def __str__(self):
        return f"Slip #{self.id} by {self.creator.username} ({self.status})"
    
    @property
    def net_votes(self):
        """Calculate net votes"""
        return self.upvotes_count - self.downvotes_count
    
    def calculate_aggregate_status(self):
        """
        Calculate aggregate slip status based on leg results.
        
        Rules:
        - All legs WON → WON
        - Any leg LOST → LOST
        - All legs VOID → VOID
        - Mixed VOID + WON (no LOST) → VOID
        - Mixed VOID + LOST → LOST
        """
        if self.total_legs == 0:
            return "PENDING"
        
        if self.lost_legs > 0:
            return "LOST"
        
        if self.won_legs == self.total_legs:
            return "WON"
        
        if self.void_legs == self.total_legs:
            return "VOID"
        
        # Mixed VOID + WON (no LOST)
        if self.won_legs > 0 and self.lost_legs == 0:
            return "VOID"
        
        return "PENDING"


class TipSlipLeg(models.Model):
    """
    Individual leg within a tip slip.
    
    Each leg is a reference to a UserTip with its own AI snapshot.
    """
    
    slip = models.ForeignKey(
        TipSlip,
        on_delete=models.CASCADE,
        related_name="legs"
    )
    
    tip = models.ForeignKey(
        UserTip,
        on_delete=models.CASCADE,
        related_name="slip_legs"
    )
    
    # Status (mirrors tip status for easy access)
    status = models.CharField(
        max_length=10,
        choices=UserTip.STATUS_CHOICES,
        default="PENDING"
    )
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "tips_tipslipeg"
        verbose_name = "Tip Slip Leg"
        verbose_name_plural = "Tip Slip Legs"
        unique_together = [["slip", "tip"]]  # One tip can only be in a slip once
        indexes = [
            models.Index(fields=["slip", "-created_at"]),
            models.Index(fields=["tip"]),
        ]
    
    def __str__(self):
        return f"Slip {self.slip.id} - Tip {self.tip.id} ({self.status})"