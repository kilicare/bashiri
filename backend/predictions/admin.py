from django.contrib import admin

from .models import League, Match, SavedMatch, Team


@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "poisson_key", "is_active"]
    search_fields = ["name", "code"]
    list_filter = ["is_active"]


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ["name", "league", "external_id"]
    search_fields = ["name"]
    list_filter = ["league"]


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ["home_team", "away_team", "league", "kickoff_at", "status", "home_score", "away_score", "is_big_match"]
    search_fields = ["home_team__name", "away_team__name"]
    list_filter = ["status", "league", "is_big_match"]
    date_hierarchy = "kickoff_at"


@admin.register(SavedMatch)
class SavedMatchAdmin(admin.ModelAdmin):
    list_display = ["user", "match", "created_at"]
    search_fields = ["user__username", "user__phone_number"]
    list_filter = ["created_at"]

