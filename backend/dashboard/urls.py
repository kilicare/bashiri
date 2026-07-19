from django.urls import path

from .views import (
    AdminActionLogListView,
    AdminActiveDerbyDetailView,
    AdminActiveDerbyListView,
    AdminBroadcastNotificationView,
    AdminCardListView,
    AdminCardToggleActiveView,
    AdminContentReportListView,
    AdminCreateDebateView,
    AdminCustomSlideDetailView,
    AdminCustomSlideListView,
    AdminDeleteDebateView,
    AdminHeroImageUploadSignatureView,
    AdminLeagueListView,
    AdminLoginView,
    AdminManualSubscriptionView,
    AdminMatchDetailView,
    AdminMatchListView,
    AdminMatchRoomMessageHideView,
    AdminMicReactionListView,
    AdminMicReactionToggleActiveView,
    AdminMLModelStatusView,
    AdminResetUserPasswordView,
    AdminResolveDebateView,
    AdminSubscriptionListView,
    AdminSupportTicketDetailView,
    AdminSupportTicketListView,
    AdminSupportTicketReplyView,
    AdminTeamListView,
    AdminTransactionListView,
    AdminUserDetailView,
    AdminUserListView,
    DashboardStatsView,
)

urlpatterns = [
    path("login/", AdminLoginView.as_view(), name="admin-login"),
    path("stats/", DashboardStatsView.as_view(), name="admin-stats"),

    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<int:user_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("users/<int:user_id>/reset-password/", AdminResetUserPasswordView.as_view(), name="admin-reset-password"),

    path("matches/", AdminMatchListView.as_view(), name="admin-match-list"),
    path("matches/<int:match_id>/", AdminMatchDetailView.as_view(), name="admin-match-detail"),

    path("leagues/", AdminLeagueListView.as_view(), name="admin-league-list"),
    path("teams/", AdminTeamListView.as_view(), name="admin-team-list"),

    path("transactions/", AdminTransactionListView.as_view(), name="admin-transaction-list"),
    path("transactions/manual-activate/", AdminManualSubscriptionView.as_view(), name="admin-manual-subscription"),
    path("subscriptions/", AdminSubscriptionListView.as_view(), name="admin-subscription-list"),

    path("cards/", AdminCardListView.as_view(), name="admin-card-list"),
    path("cards/<int:card_id>/toggle/", AdminCardToggleActiveView.as_view(), name="admin-card-toggle"),

    path("notifications/broadcast/", AdminBroadcastNotificationView.as_view(), name="admin-broadcast"),

    path("ml-status/", AdminMLModelStatusView.as_view(), name="admin-ml-status"),
    path("action-log/", AdminActionLogListView.as_view(), name="admin-action-log"),

    path("derbies/", AdminActiveDerbyListView.as_view(), name="admin-derby-list"),
    path("derbies/<int:derby_id>/", AdminActiveDerbyDetailView.as_view(), name="admin-derby-detail"),

    path("debates/", AdminCreateDebateView.as_view(), name="admin-create-debate"),
    path("debates/<int:card_id>/resolve/", AdminResolveDebateView.as_view(), name="admin-resolve-debate"),
    path("debates/<int:card_id>/", AdminDeleteDebateView.as_view(), name="admin-delete-debate"),

    path("matchroom-messages/<int:message_id>/hide/", AdminMatchRoomMessageHideView.as_view(), name="admin-hide-message"),

    path("mic-reactions/", AdminMicReactionListView.as_view(), name="admin-mic-list"),
    path("mic-reactions/<int:reaction_id>/toggle/", AdminMicReactionToggleActiveView.as_view(), name="admin-mic-toggle"),

    path("support/tickets/", AdminSupportTicketListView.as_view(), name="admin-support-list"),
    path("support/tickets/<int:ticket_id>/", AdminSupportTicketDetailView.as_view(), name="admin-support-detail"),
    path("support/tickets/<int:ticket_id>/reply/", AdminSupportTicketReplyView.as_view(), name="admin-support-reply"),
    path("support/content-reports/", AdminContentReportListView.as_view(), name="admin-content-reports"),

    path("hero-slides/", AdminCustomSlideListView.as_view(), name="admin-hero-slide-list"),
    path("hero-slides/<int:slide_id>/", AdminCustomSlideDetailView.as_view(), name="admin-hero-slide-detail"),
    path("hero-slides/upload-signature/", AdminHeroImageUploadSignatureView.as_view(), name="admin-hero-upload-signature"),
]
