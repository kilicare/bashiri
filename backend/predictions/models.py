"""
predictions/models.py

MUHIMU: League.poisson_key LAZIMA iendane EXACTLY na keys za
bashiri_prediction_models.json: "EPL", "LaLiga", "Bundesliga", "Ligue1".
Team.name LAZIMA iendane EXACTLY na majina ya football-data.org (ndio
maana Team hazitengenezwi kwa mkono — sync_football_data inazitengeneza).
"""
from django.conf import settings
from django.db import models


class League(models.Model):
    code = models.CharField(max_length=10, unique=True, help_text="Kodi ya football-data.org: PL, PD, BL1, FL1")
    name = models.CharField(max_length=100)
    poisson_key = models.CharField(max_length=30, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "predictions_league"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Team(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=150)
    crest_url = models.URLField(max_length=500, blank=True, default="")
    external_id = models.PositiveIntegerField(unique=True, null=True, blank=True)

    class Meta:
        db_table = "predictions_team"
        unique_together = ["league", "name"]
        ordering = ["name"]

    def __str__(self):
        return self.name


class Match(models.Model):
    STATUS_CHOICES = [
        ("SCHEDULED", "Scheduled"),
        ("LIVE", "Live"),
        ("FINISHED", "Finished"),
        ("POSTPONED", "Postponed"),
        ("CANCELLED", "Cancelled"),
    ]

    external_id = models.PositiveIntegerField(unique=True)
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="matches")
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="home_matches")
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="away_matches")
    kickoff_at = models.DateTimeField(db_index=True)
    matchday = models.PositiveSmallIntegerField(null=True, blank=True)
    stage = models.CharField(
        max_length=30, blank=True, default="",
        help_text="mfano: GROUP_STAGE, LAST_16, QUARTER_FINALS, SEMI_FINALS, FINAL (kwa mashindano kama World Cup)",
    )
    group_name = models.CharField(
        max_length=20, blank=True, default="",
        help_text="mfano: 'Group A' (kwa Group Stage pekee)",
    )
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="SCHEDULED")
    home_score = models.PositiveSmallIntegerField(null=True, blank=True)
    away_score = models.PositiveSmallIntegerField(null=True, blank=True)
    last_event = models.CharField(max_length=50, null=True, blank=True, help_text="Last match event from API (e.g., 'GOAL', 'HALF_TIME')")
    is_big_match = models.BooleanField(
        default=False,
        help_text="Weka True kwa mkono (derby, top-of-table) — inaongeza bonus ya score kwenye Feed ranking, SI card type tofauti.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "predictions_match"
        ordering = ["kickoff_at"]

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} ({self.kickoff_at:%Y-%m-%d})"

    @property
    def is_finished(self):
        return self.status == "FINISHED"

    @property
    def stage_display(self):
        """Jina la kusomeka la stage, kwa UI."""
        labels = {
            "GROUP_STAGE": "Group Stage",
            "LAST_32": "Round of 32",
            "LAST_16": "Round of 16",
            "QUARTER_FINALS": "Quarter-Final",
            "SEMI_FINALS": "Semi-Final",
            "THIRD_PLACE": "Third Place Play-off",
            "FINAL": "Final",
        }
        return labels.get(self.stage, self.stage)


class SavedMatch(models.Model):
    """'💾 Save Match' — BURE kwa mtumiaji yeyote aliye-login."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_matches")
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="saved_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "predictions_savedmatch"
        unique_together = ["user", "match"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} saved {self.match}"


class ActiveDerby(models.Model):
    """Config ya 'Derby Week' — admin anaiweka kwa mkono kwa mechi maalum."""
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="derby_home")
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="derby_away")
    match = models.ForeignKey(Match, on_delete=models.SET_NULL, null=True, blank=True, related_name="derby_config")
    derby_name = models.CharField(max_length=100, help_text="mfano: 'Kariakoo Derby'")
    starts_at = models.DateTimeField(help_text="Wakati Derby Mode inaanza kuonekana (kawaida masaa 48 kabla ya kickoff)")
    ends_at = models.DateTimeField(help_text="Wakati Derby Mode inaisha (kawaida masaa 2 baada ya FT)")
    theme_accent_color = models.CharField(max_length=7, default="#FF4757", help_text="Hex color, mfano #FF4757")
    banner_text = models.CharField(max_length=150, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "predictions_activederby"
        ordering = ["-starts_at"]

    def __str__(self):
        return f"{self.derby_name}: {self.home_team} vs {self.away_team}"

    @property
    def is_currently_active(self):
        from django.utils import timezone
        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.ends_at


class AIPerformance(models.Model):
    """Tracking ya accuracy ya AI model kwa transparency na trust building."""
    date = models.DateField(unique=True, db_index=True)
    total_predictions = models.PositiveIntegerField(default=0)
    correct_predictions = models.PositiveIntegerField(default=0)
    accuracy_percentage = models.FloatField(default=0.0)
    high_confidence_predictions = models.PositiveIntegerField(default=0, help_text="Predictions with confidence >= 70%")
    high_confidence_correct = models.PositiveIntegerField(default=0, help_text="Correct high confidence predictions")
    high_confidence_accuracy = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "predictions_aiperformance"
        ordering = ["-date"]

    def __str__(self):
        return f"AI Performance {self.date}: {self.accuracy_percentage}%"

    def calculate_accuracy(self):
        """Recalculate accuracy percentages."""
        if self.total_predictions > 0:
            self.accuracy_percentage = round((self.correct_predictions / self.total_predictions) * 100, 1)
        if self.high_confidence_predictions > 0:
            self.high_confidence_accuracy = round((self.high_confidence_correct / self.high_confidence_predictions) * 100, 1)
        self.save(update_fields=["accuracy_percentage", "high_confidence_accuracy"])


class AITrackRecordSnapshot(models.Model):
    """
    Snapshot ya kila siku ya utendaji wa AI (per-market accuracy kwa
    ligi zote/kwa ligi moja moja, weekly trend, boldest correct calls).
    AITrackRecordView inasoma snapshot ya MWISHO pekee (O(1)), badala
    ya kuhesabu live kila request (ambayo ingekuwa ghali sana kwa
    mechi mamia/maelfu).
    """
    generated_at = models.DateTimeField(auto_now_add=True, db_index=True)
    data = models.JSONField(default=dict)

    class Meta:
        db_table = "predictions_aitrackrecordsnapshot"
        ordering = ["-generated_at"]

    def __str__(self):
        return f"AI Track Record Snapshot ({self.generated_at:%Y-%m-%d %H:%M})"
