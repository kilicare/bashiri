from django.contrib import admin
from django.utils.html import format_html
from .models import UserTip, TipPerformance, TipComment, TipVote, TipShare


@admin.register(UserTip)
class UserTipAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'match', 'market_key', 'status',
        'confidence', 'views_count', 'engagement_score', 'created_at'
    ]
    list_filter = [
        'status', 'visibility', 'market_key', 'created_at'
    ]
    search_fields = ['user__username', 'reasoning']
    readonly_fields = [
        'views_count', 'upvotes_count', 'downvotes_count',
        'comments_count', 'created_at', 'updated_at', 'verified_at'
    ]
    
    fieldsets = (
        ('Tip Info', {
            'fields': ('user', 'match', 'market_key', 'selection', 'confidence')
        }),
        ('Analysis', {
            'fields': ('reasoning', 'visibility')
        }),
        ('Status', {
            'fields': ('status', 'verified_at')
        }),
        ('Engagement', {
            'fields': ('views_count', 'upvotes_count', 'downvotes_count', 'comments_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def engagement_score(self, obj):
        score = obj.engagement_score
        if score > 50:
            color = 'green'
        elif score > 20:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {};">{:.1f}</span>',
            color, score
        )
    engagement_score.short_description = 'Engagement Score'


@admin.register(TipPerformance)
class TipPerformanceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'total_tips', 'correct_tips', 'accuracy_percentage',
        'current_streak', 'best_streak'
    ]
    list_filter = ['accuracy_percentage', 'total_tips']
    search_fields = ['user__username']
    readonly_fields = [
        'accuracy_percentage', 'accuracy_1x2', 'accuracy_btts',
        'accuracy_over_under', 'accuracy_double_chance'
    ]
    
    def has_add_permission(self, request):
        return False  # Created automatically


@admin.register(TipComment)
class TipCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'tip', 'created_at', 'content_preview']
    list_filter = ['created_at']
    search_fields = ['user__username', 'content']
    readonly_fields = ['created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(TipVote)
class TipVoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'tip', 'vote', 'created_at']
    list_filter = ['vote', 'created_at']
    search_fields = ['user__username']
    
    def has_add_permission(self, request):
        return False


@admin.register(TipShare)
class TipShareAdmin(admin.ModelAdmin):
    list_display = ['id', 'tip', 'shared_to', 'created_at']
    list_filter = ['shared_to', 'created_at']
    
    def has_add_permission(self, request):
        return False