from rest_framework import serializers

from .models import ActiveDerby, League, Match, OddsBookmaker, OddsUpdate, SavedMatch, SavedMarket, Team, TeamStanding, HeadToHead


class LeagueSerializer(serializers.ModelSerializer):
    class Meta:
        model = League
        fields = ["id", "code", "name", "poisson_key", "logo_url", "is_active"]


class TeamSerializer(serializers.ModelSerializer):
    league = LeagueSerializer(read_only=True)
    
    class Meta:
        model = Team
        fields = ["id", "name", "crest_url", "league"]


class MatchListSerializer(serializers.ModelSerializer):
    home_team = TeamSerializer()
    away_team = TeamSerializer()
    league = LeagueSerializer()
    stage_display = serializers.ReadOnlyField()

    class Meta:
        model = Match
        fields = [
            "id", "league", "home_team", "away_team", "kickoff_at",
            "status", "home_score", "away_score", "is_big_match",
            "stage", "stage_display", "group_name", "matchday",
        ]


class SavedMatchSerializer(serializers.ModelSerializer):
    match = MatchListSerializer(read_only=True)
    match_id = serializers.PrimaryKeyRelatedField(queryset=Match.objects.all(), source="match", write_only=True)

    class Meta:
        model = SavedMatch
        fields = ["id", "match", "match_id", "created_at"]
        read_only_fields = ["id", "created_at"]


class SavedMarketSerializer(serializers.ModelSerializer):
    match = MatchListSerializer(read_only=True)
    match_id = serializers.PrimaryKeyRelatedField(queryset=Match.objects.all(), source="match", write_only=True)

    class Meta:
        model = SavedMarket
        fields = ["id", "match", "match_id", "market_key", "created_at"]
        read_only_fields = ["id", "created_at"]


class ActiveDerbySerializer(serializers.ModelSerializer):
    home_team_detail = TeamSerializer(source="home_team", read_only=True)
    away_team_detail = TeamSerializer(source="away_team", read_only=True)
    match_id = serializers.IntegerField(source="match.id", read_only=True, allow_null=True)

    class Meta:
        model = ActiveDerby
        fields = [
            "id", "home_team", "home_team_detail", "away_team", "away_team_detail",
            "match_id", "derby_name", "starts_at", "ends_at", "theme_accent_color",
            "banner_text", "is_active",
        ]


class OddsBookmakerSerializer(serializers.ModelSerializer):
    """Serializer for odds bookmakers with language support."""
    match = MatchListSerializer(read_only=True)
    
    # Localized market labels
    market_label = serializers.SerializerMethodField()
    
    # Ensure odds are returned as floats, not strings
    home_win_odds = serializers.FloatField(allow_null=True)
    draw_odds = serializers.FloatField(allow_null=True)
    away_win_odds = serializers.FloatField(allow_null=True)
    over_odds = serializers.FloatField(allow_null=True)
    under_odds = serializers.FloatField(allow_null=True)
    btts_yes_odds = serializers.FloatField(allow_null=True)
    btts_no_odds = serializers.FloatField(allow_null=True)
    
    class Meta:
        model = OddsBookmaker
        fields = [
            "id", "match", "bookmaker_name", "market_type", "market_label",
            "home_win_odds", "draw_odds", "away_win_odds",
            "over_odds", "under_odds", "btts_yes_odds", "btts_no_odds",
            "last_updated", "is_live",
        ]
    
    def get_market_label(self, obj):
        """Get localized market label based on language context."""
        lang = self.context.get("lang", "en")
        
        labels = {
            "1X2": {
                "en": "1X2 (Home/Draw/Away)",
                "sw": "1X2 (Nyumbani/Sare/Wageni)",
            },
            "OVER_UNDER_2_5": {
                "en": "Over/Under 2.5 Goals",
                "sw": "Zaidi/Kiasi ya Magoli 2.5",
            },
            "BTTS": {
                "en": "Both Teams to Score",
                "sw": "Timu Zote Kufunga",
            },
            "DOUBLE_CHANCE": {
                "en": "Double Chance",
                "sw": "Nafasi Mbili",
            },
        }
        
        return labels.get(obj.market_type, {}).get(lang, obj.get_market_type_display())


class OddsUpdateSerializer(serializers.ModelSerializer):
    """Serializer for odds history updates."""
    class Meta:
        model = OddsUpdate
        fields = [
            "id", "bookmaker_odds", "home_win_odds", "draw_odds", "away_win_odds",
            "over_odds", "under_odds", "btts_yes_odds", "btts_no_odds", "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]


class TeamStandingSerializer(serializers.ModelSerializer):
    """Serializer for team standings."""
    team = TeamSerializer(read_only=True)
    league = LeagueSerializer(read_only=True)
    
    class Meta:
        model = TeamStanding
        fields = [
            "id", "team", "league", "position", "matches_played",
            "won", "draw", "lost", "goals_for", "goals_against",
            "goal_difference", "points", "form", "form_rating", "updated_at"
        ]


class HeadToHeadSerializer(serializers.ModelSerializer):
    """Serializer for head-to-head history."""
    home_team = TeamSerializer(read_only=True)
    away_team = TeamSerializer(read_only=True)
    league = LeagueSerializer(read_only=True)
    
    class Meta:
        model = HeadToHead
        fields = [
            "id", "home_team", "away_team", "league", "total_matches",
            "home_wins", "draws", "away_wins", "home_goals", "away_goals",
            "last_5_matches", "updated_at"
        ]
