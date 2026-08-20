"""
accounts/urls.py

OTP routes (request-otp/, verify-otp/) zimewekwa chini kama COMMENT.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CompleteProfileView,
    DeleteAccountView,
    FavoriteLeaguesView,
    FavoriteTeamsView,
    LoginView,
    LogoutView,
    MeView,
    OnboardingView,
    PublicProfileView,
    RegisterView,
    RequestPasswordResetView,
    UpdateAvatarView,
    UpdateSettingsView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("request-password-reset/", RequestPasswordResetView.as_view(), name="request-password-reset"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("complete-profile/", CompleteProfileView.as_view(), name="complete-profile"),
    path("me/", MeView.as_view(), name="me"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("favorite-teams/", FavoriteTeamsView.as_view(), name="favorite-teams"),
    path("favorite-leagues/", FavoriteLeaguesView.as_view(), name="favorite-leagues"),
    path("onboarding/", OnboardingView.as_view(), name="onboarding"),
    path("settings/", UpdateSettingsView.as_view(), name="update-settings"),
    path("update-avatar/", UpdateAvatarView.as_view(), name="update-avatar"),
    path("profile/<str:username>/", PublicProfileView.as_view(), name="public-profile"),
    path("delete-account/", DeleteAccountView.as_view(), name="delete-account"),

    # ============================================================
    # OTP FLOW — IMESIMAMISHWA (commented out, si kufutwa)
    # ============================================================
    # path("request-otp/", RequestOTPView.as_view(), name="request-otp"),
    # path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
]
