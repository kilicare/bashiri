from django.urls import path

from .views import (
    FanOfMatchView, MicActiveMatchesView, MicCanPostView, MicMoodSummaryView,
    MicReactionCreateView, MicReactionDeleteView, MicReactionListView, MicReactionVoteView, 
    MicUploadSignatureView, UserMicReactionsView,
)

urlpatterns = [
    path("upload-signature/", MicUploadSignatureView.as_view(), name="mic-upload-signature"),
    path("active-matches/", MicActiveMatchesView.as_view(), name="mic-active-matches"),
    path("my-reactions/", UserMicReactionsView.as_view(), name="mic-my-reactions"),
    path("", MicReactionCreateView.as_view(), name="mic-create"),
    path("<int:match_id>/", MicReactionListView.as_view(), name="mic-list"),
    path("<int:match_id>/can-post/", MicCanPostView.as_view(), name="mic-can-post"),
    path("<int:match_id>/mood-summary/", MicMoodSummaryView.as_view(), name="mic-mood-summary"),
    path("<int:match_id>/fan-of-match/", FanOfMatchView.as_view(), name="mic-fan-of-match"),
    path("reactions/<int:reaction_id>/vote/", MicReactionVoteView.as_view(), name="mic-vote"),
    path("reactions/<int:reaction_id>/", MicReactionDeleteView.as_view(), name="mic-delete"),
]