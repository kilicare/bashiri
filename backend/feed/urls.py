from django.urls import path

from .views import DebateVoteView, FeedListView, PollVoteView

urlpatterns = [
    path("", FeedListView.as_view(), name="feed-list"),
    path("polls/<int:card_id>/vote/", PollVoteView.as_view(), name="poll-vote"),
    path("polls/<int:card_id>/vote-check/", PollVoteView.as_view(), name="poll-vote-check"),
    path("debates/<int:card_id>/vote/", DebateVoteView.as_view(), name="debate-vote"),
]
