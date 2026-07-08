from django.urls import path

from .views import (
    CreateUserPredictionView, DebateVoteView, FeedListView, LeaderboardView,
    MyPredictionsView, PollVoteView,
)

urlpatterns = [
    path("", FeedListView.as_view(), name="feed-list"),
    path("predictions/", CreateUserPredictionView.as_view(), name="create-user-prediction"),
    path("my-predictions/", MyPredictionsView.as_view(), name="my-predictions"),
    path("polls/<int:card_id>/vote/", PollVoteView.as_view(), name="poll-vote"),
    path("debates/<int:card_id>/vote/", DebateVoteView.as_view(), name="debate-vote"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
