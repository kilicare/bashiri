from django.urls import path

from .views import (
    CompleteProfileView,
    FavoriteLeaguesView,
    FavoriteTeamsView,
    LogoutView,
    MeView,
    OnboardingView,
    RequestOTPView,
    SettingsView,
    UpdateAvatarView,
    UpdateSettingsView,
    VerifyOTPView
)

urlpatterns = [
    path("request-otp/", RequestOTPView.as_view(), name="request-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("complete-profile/", CompleteProfileView.as_view(), name="complete-profile"),
    path("onboarding/", OnboardingView.as_view(), name="onboarding"),
    path("me/", MeView.as_view(), name="me"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("update-avatar/", UpdateAvatarView.as_view(), name="update-avatar"),
    path("favorite-teams/", FavoriteTeamsView.as_view(), name="favorite-teams"),
    path("favorite-leagues/", FavoriteLeaguesView.as_view(), name="favorite-leagues"),
    path("settings/", UpdateSettingsView.as_view(), name="update-settings"),
]
