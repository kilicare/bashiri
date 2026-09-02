from django.urls import path
from .views import (
    TipListView, TipDetailView, TipVoteView, TipCommentView,
    TipLeaderboardView, UserTipsView, TipShareView,
    TipSlipListView, TipSlipDetailView, MarketRegistryView,
    BestStreakUserView
)

app_name = 'tips'

urlpatterns = [
    # Tips CRUD
    path('', TipListView.as_view(), name='tip-list'),
    path('<int:tip_id>/', TipDetailView.as_view(), name='tip-detail'),

    # Voting & Engagement
    path('<int:tip_id>/vote/', TipVoteView.as_view(), name='tip-vote'),
    path('<int:tip_id>/comments/', TipCommentView.as_view(), name='tip-comments'),
    path('<int:tip_id>/share/', TipShareView.as_view(), name='tip-share'),

    # Tip Slips
    path('slips/', TipSlipListView.as_view(), name='slip-list'),
    path('slips/<int:slip_id>/', TipSlipDetailView.as_view(), name='slip-detail'),

    # Leaderboard & User Tips
    path('leaderboard/', TipLeaderboardView.as_view(), name='leaderboard'),
    path('user/<str:username>/', UserTipsView.as_view(), name='user-tips'),

    # Best Streak User
    path('best-streak-user/', BestStreakUserView.as_view(), name='best-streak-user'),

    # Market Registry
    path('markets/', MarketRegistryView.as_view(), name='market-registry'),
]