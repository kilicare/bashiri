from rest_framework import serializers

from .models import ActiveDerby, League, Match, SavedMatch, Team


class LeagueSerializer(serializers.ModelSerializer):
    class Meta:
        model = League
        fields = ["id", "code", "name", "poisson_key"]


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "crest_url"]


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
