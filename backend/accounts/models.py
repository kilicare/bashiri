"""
accounts/models.py

BASHIRI — User Model (Phone-Based, Hakuna Password kwa Login la Kawaida)
Login la mtumiaji ni OTP pekee. Password field (kutoka AbstractBaseUser)
ni kwa ajili ya Django Admin staff/superuser access pekee.

MUHIMU: favorite_teams/favorite_leagues (M2M kwenda predictions.Team na
predictions.League) HAZIPO bado hapa kwa makusudi — Team/League models
hazijaundwa (zinakuja Wiki 3). Zitaongezwa mwishoni mwa Wiki 3 kama
nyongeza ya pili ya faili hii (angalia sehemu husika).
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    phone_number = models.CharField(
        max_length=20, unique=True, db_index=True,
        help_text="Muundo wa E.164, mfano +255712345678",
    )
    username = models.CharField(
        max_length=30, unique=True, null=True, blank=True,
        help_text="Inawekwa baada ya OTP kuthibitishwa (complete-profile step).",
    )
    date_of_birth = models.DateField(null=True, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True, default="")
    preferred_language = models.CharField(
        max_length=2, choices=[("sw", "Kiswahili"), ("en", "English")], default="sw"
    )
    favorite_teams = models.ManyToManyField(
        "predictions.Team", blank=True, related_name="fans"
    )
    favorite_leagues = models.ManyToManyField(
        "predictions.League", blank=True, related_name="followers"
    )

    is_subscriber = models.BooleanField(default=False)
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    current_streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    total_predictions = models.PositiveIntegerField(default=0)
    correct_predictions = models.PositiveIntegerField(default=0)

    # Tip-specific tracking fields
    tip_count = models.PositiveIntegerField(default=0)
    tip_accuracy = models.FloatField(default=0.0)
    tipster_score = models.PositiveSmallIntegerField(default=0, db_index=True)
    verified_tipster = models.BooleanField(default=False)
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    
    # Follower/Following relationships
    following = models.ManyToManyField(
        "self", 
        blank=True, 
        related_name="followers",
        symmetrical=False,
        through="UserFollow"
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "accounts_user"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.username or self.phone_number

    @property
    def profile_complete(self):
        return bool(self.username and self.date_of_birth)

    @property
    def accuracy_percentage(self):
        if self.total_predictions == 0:
            return 0.0
        return round((self.correct_predictions / self.total_predictions) * 100, 1)

    @property
    def is_subscription_active(self):
        if not self.is_subscriber or not self.subscription_expires_at:
            return False
        return self.subscription_expires_at > timezone.now()

    @property
    def user_tip_stats(self):
        """Get user's tip statistics"""
        try:
            return self.tip_performance
        except:
            # Create if doesn't exist
            from tips.models import TipPerformance
            perf, _ = TipPerformance.objects.get_or_create(user=self)
            return perf

    def get_tip_accuracy(self):
        """Get user's tip accuracy percentage"""
        try:
            return self.user_tip_stats.accuracy_percentage
        except:
            return 0.0

    def get_total_tips(self):
        """Get user's total tips"""
        try:
            return self.user_tip_stats.total_tips
        except:
            return 0


class UserFollow(models.Model):
    """Through model for user following relationships with timestamps"""
    follower = models.ForeignKey(
        "User", 
        on_delete=models.CASCADE, 
        related_name="following_relationships"
    )
    following = models.ForeignKey(
        "User", 
        on_delete=models.CASCADE, 
        related_name="follower_relationships"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "accounts_userfollow"
        unique_together = ["follower", "following"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


class OTPCode(models.Model):
    """OTP imeunganishwa na namba ya simu, sio User — mtumiaji anaweza asiwe amejisajili bado."""
    phone_number = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "accounts_otpcode"
        ordering = ["-created_at"]

    def __str__(self):
        return f"OTP({self.phone_number}, used={self.is_used})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired and self.attempts < 5
