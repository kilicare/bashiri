from django.urls import path

from .views import (
    FanOfMatchView, MicCanPostView, MicMoodSummaryView, MicReactionCreateView,
    MicReactionListView, MicReactionVoteView, MicUploadSignatureView,
)

urlpatterns = [
    path("upload-signature/", MicUploadSignatureView.as_view(), name="mic-upload-signature"),
    path("", MicReactionCreateView.as_view(), name="mic-create"),
    path("<int:match_id>/", MicReactionListView.as_view(), name="mic-list"),
    path("<int:match_id>/can-post/", MicCanPostView.as_view(), name="mic-can-post"),
    path("<int:match_id>/mood-summary/", MicMoodSummaryView.as_view(), name="mic-mood-summary"),
    path("<int:match_id>/fan-of-match/", FanOfMatchView.as_view(), name="mic-fan-of-match"),
    path("reactions/<int:reaction_id>/vote/", MicReactionVoteView.as_view(), name="mic-vote"),
]