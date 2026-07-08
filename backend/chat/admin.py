from django.contrib import admin

from .models import ChatMessage, ChatUsage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ["user", "session_key", "role", "created_at"]
    search_fields = ["user__username", "user__phone_number", "content"]
    list_filter = ["role", "created_at"]
    date_hierarchy = "created_at"


@admin.register(ChatUsage)
class ChatUsageAdmin(admin.ModelAdmin):
    list_display = ["user", "session_key", "date", "count"]
    search_fields = ["user__username", "user__phone_number", "session_key"]
    list_filter = ["date"]
    date_hierarchy = "date"
