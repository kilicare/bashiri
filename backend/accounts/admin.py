from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import OTPCode, User


class UserAdmin(DjangoUserAdmin):
    model = User
    ordering = ["-date_joined"]
    list_display = ["phone_number", "username", "is_subscriber", "is_staff", "date_joined"]
    search_fields = ["phone_number", "username"]
    list_filter = ["is_subscriber", "is_staff", "is_active"]

    fieldsets = (
        (None, {"fields": ("phone_number", "password")}),
        ("Taarifa Binafsi", {"fields": ("username", "date_of_birth", "avatar_url")}),
        ("Subscription & Stats", {"fields": (
            "is_subscriber", "subscription_expires_at", "current_streak",
            "best_streak", "total_predictions", "correct_predictions",
        )}),
        ("Permissions", {"fields": (
            "is_active", "is_staff", "is_superuser", "groups", "user_permissions",
        )}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone_number", "password1", "password2", "is_staff", "is_superuser"),
        }),
    )


admin.site.register(User, UserAdmin)


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ["phone_number", "code", "is_used", "attempts", "created_at", "expires_at"]
    list_filter = ["is_used"]
    search_fields = ["phone_number"]