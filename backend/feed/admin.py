from django.contrib import admin

from .models import Card, PollVote, UserPrediction


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ["type", "match", "created_at", "is_active"]
    search_fields = ["type", "match__home_team__name", "match__away_team__name"]
    list_filter = ["type", "is_active", "created_at"]
    date_hierarchy = "created_at"


@admin.register(UserPrediction)
class UserPredictionAdmin(admin.ModelAdmin):
    list_display = ["user", "match", "market", "selection", "is_correct", "created_at"]
    search_fields = ["user__username", "user__phone_number", "match__home_team__name", "match__away_team__name"]
    list_filter = ["market", "is_correct", "created_at"]
    date_hierarchy = "created_at"


@admin.register(PollVote)
class PollVoteAdmin(admin.ModelAdmin):
    list_display = ["user", "card", "choice", "created_at"]
    search_fields = ["user__username", "user__phone_number", "choice"]
    list_filter = ["choice", "created_at"]
    date_hierarchy = "created_at"

