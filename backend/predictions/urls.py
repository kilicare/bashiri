from django.urls import path

from .views import (
    ActiveDerbyView, FixturesView, LeagueListView, LiveMatchesView, MatchDashboardView, MatchOverviewView,
    SavedMatchesListView, SaveMatchView, SearchView, TeamListView, FinishedMatchesView,
)

urlpatterns = [
    path("fixtures/", FixturesView.as_view(), name="fixtures"),
    path("live/", LiveMatchesView.as_view(), name="live-matches"),
    path("search/", SearchView.as_view(), name="search"),
    path("leagues/", LeagueListView.as_view(), name="league-list"),
    path("teams/", TeamListView.as_view(), name="team-list"),
    path("active-derby/", ActiveDerbyView.as_view(), name="active-derby"),
    path("matches/<int:match_id>/overview/", MatchOverviewView.as_view(), name="match-overview"),
    path("matches/<int:match_id>/dashboard/", MatchDashboardView.as_view(), name="match-dashboard"),
    path("save/", SaveMatchView.as_view(), name="save-match"),
    path("saved/", SavedMatchesListView.as_view(), name="saved-matches"),
    path("finished/", FinishedMatchesView.as_view(), name="finished-matches"),
]
