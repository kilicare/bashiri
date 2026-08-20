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
    logo_url = models.URLField(max_length=500, blank=True, default="", help_text="League logo URL from football-data.org")
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


class SavedMarket(models.Model):
    """'💾 Save Market' — BURE kwa mtumiaji yeyote aliye-login."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_markets")
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="saved_markets")
    market_key = models.CharField(max_length=50, help_text="Market key, e.g., '1x2', 'btts'")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "predictions_savedmarket"
        unique_together = ["user", "match", "market_key"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} saved {self.market_key} for {self.match}"


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
    
    # Market-specific tracking
    predictions_1x2 = models.PositiveIntegerField(default=0, help_text="Total 1X2 predictions")
    correct_1x2 = models.PositiveIntegerField(default=0, help_text="Correct 1X2 predictions")
    accuracy_1x2 = models.FloatField(default=0.0, help_text="1X2 accuracy percentage")
    
    predictions_btts = models.PositiveIntegerField(default=0, help_text="Total BTTS predictions")
    correct_btts = models.PositiveIntegerField(default=0, help_text="Correct BTTS predictions")
    accuracy_btts = models.FloatField(default=0.0, help_text="BTTS accuracy percentage")
    
    predictions_over_under = models.PositiveIntegerField(default=0, help_text="Total Over/Under predictions")
    correct_over_under = models.PositiveIntegerField(default=0, help_text="Correct Over/Under predictions")
    accuracy_over_under = models.FloatField(default=0.0, help_text="Over/Under accuracy percentage")
    
    # Streak tracking
    current_streak = models.PositiveSmallIntegerField(default=0, help_text="Current correct prediction streak")
    best_streak = models.PositiveSmallIntegerField(default=0, help_text="Best correct prediction streak")
    
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
        
        # Calculate market-specific accuracy
        if self.predictions_1x2 > 0:
            self.accuracy_1x2 = round((self.correct_1x2 / self.predictions_1x2) * 100, 1)
        if self.predictions_btts > 0:
            self.accuracy_btts = round((self.correct_btts / self.predictions_btts) * 100, 1)
        if self.predictions_over_under > 0:
            self.accuracy_over_under = round((self.correct_over_under / self.predictions_over_under) * 100, 1)
        
        self.save(update_fields=["accuracy_percentage", "high_confidence_accuracy", "accuracy_1x2", "accuracy_btts", "accuracy_over_under"])


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


class OddsBookmaker(models.Model):
    """Live odds from bookmakers for matches."""
    MARKET_CHOICES = [
        ("1X2", "1X2 (Home/Draw/Away)"),
        ("OVER_UNDER_2_5", "Over/Under 2.5 Goals"),
        ("BTTS", "Both Teams to Score"),
        ("DOUBLE_CHANCE", "Double Chance"),
    ]
    
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="odds_bookmakers")
    bookmaker_name = models.CharField(max_length=100, help_text="e.g., Bet365, DraftKings")
    market_type = models.CharField(max_length=20, choices=MARKET_CHOICES, default="1X2")
    home_win_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    draw_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    away_win_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    over_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="For OVER_UNDER markets")
    under_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="For OVER_UNDER markets")
    btts_yes_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="For BTTS market")
    btts_no_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="For BTTS market")
    last_updated = models.DateTimeField(auto_now=True)
    is_live = models.BooleanField(default=False, help_text="True if odds are for live matches")
    
    class Meta:
        db_table = "predictions_oddsbookmaker"
        ordering = ["-last_updated"]
        indexes = [
            models.Index(fields=["match", "market_type"]),
            models.Index(fields=["bookmaker_name"]),
            models.Index(fields=["-last_updated"]),
        ]
    
    def __str__(self):
        return f"{self.bookmaker_name} - {self.match} ({self.market_type})"


class OddsUpdate(models.Model):
    """Historical tracking of odds changes for analysis."""
    bookmaker_odds = models.ForeignKey(OddsBookmaker, on_delete=models.CASCADE, related_name="history")
    home_win_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    draw_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    away_win_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    over_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    under_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    btts_yes_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    btts_no_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "predictions_oddsupdate"
        ordering = ["-timestamp"]
    
    def __str__(self):
        return f"Odds update for {self.bookmaker_odds} at {self.timestamp}"


class TeamStanding(models.Model):
    """Current team standings from Football Data Org."""
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="standings")
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="team_standings")
    position = models.PositiveSmallIntegerField()
    matches_played = models.PositiveSmallIntegerField()
    won = models.PositiveSmallIntegerField()
    draw = models.PositiveSmallIntegerField()
    lost = models.PositiveSmallIntegerField()
    goals_for = models.PositiveSmallIntegerField()
    goals_against = models.PositiveSmallIntegerField()
    goal_difference = models.IntegerField()
    points = models.PositiveSmallIntegerField()
    form = models.CharField(max_length=10, blank=True, help_text="Last 5 matches: W, D, L, W, D")
    form_rating = models.FloatField(default=50.0, help_text="Form rating 0-100 based on recent results")
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "predictions_teamstanding"
        unique_together = ["team", "league"]
        ordering = ["position"]
    
    def __str__(self):
        return f"{self.team.name} - Position {self.position} ({self.points} pts)"


class HeadToHead(models.Model):
    """Head-to-head history between teams."""
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="h2h_home")
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="h2h_away")
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="h2h_league")
    total_matches = models.PositiveSmallIntegerField(default=0)
    home_wins = models.PositiveSmallIntegerField(default=0)
    draws = models.PositiveSmallIntegerField(default=0)
    away_wins = models.PositiveSmallIntegerField(default=0)
    home_goals = models.PositiveSmallIntegerField(default=0)
    away_goals = models.PositiveSmallIntegerField(default=0)
    last_5_matches = models.JSONField(default=list, help_text="Last 5 H2H matches with results")
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "predictions_headtohead"
        unique_together = ["home_team", "away_team", "league"]
    
    def __str__(self):
        return f"{self.home_team} vs {self.away_team}: {self.home_wins}-{self.draws}-{self.away_wins}"
