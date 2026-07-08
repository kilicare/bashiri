from django.urls import path

from .views import MatchRoomHistoryView

urlpatterns = [
    path("<int:match_id>/history/", MatchRoomHistoryView.as_view(), name="matchroom-history"),
]