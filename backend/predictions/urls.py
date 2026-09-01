from django.urls import path

from .views import (
    ActiveDerbyView, AITrackRecordView, AIPerformanceStatsView, BookmakersView, CommandSearchView, FixturesView, LeagueListView,
    LiveMatchesView, MatchAnalysisView, MatchDashboardView, MatchOddsView, MatchOverviewView, OddsListView,
    SavedMatchesListView, SavedMarketsListView, SaveMatchView, SaveMarketView, SearchView, TeamListView, FinishedMatchesView, SyncHistoricalView, GenerateSavedMarketsPDFView,
    TeamStandingsView, HeadToHeadView, TeamDetailView, LeagueDetailView,
)
from .ai_pick_views import AIPickListView, AIResultRecapView, AIAnalyticsView

urlpatterns = [
    path("fixtures/", FixturesView.as_view(), name="fixtures"),
    path("live/", LiveMatchesView.as_view(), name="live-matches"),
    path("search/", SearchView.as_view(), name="search"),
    path("command-search/", CommandSearchView.as_view(), name="command-search"),
    path("leagues/", LeagueListView.as_view(), name="league-list"),
    path("leagues/<str:league_code>/", LeagueDetailView.as_view(), name="league-detail"),
    path("teams/", TeamListView.as_view(), name="team-list"),
    path("teams/<int:team_id>/", TeamDetailView.as_view(), name="team-detail"),
    path("active-derby/", ActiveDerbyView.as_view(), name="active-derby"),
    path("ai-track-record/", AITrackRecordView.as_view(), name="ai-track-record"),
    path("ai-performance/", AIPerformanceStatsView.as_view(), name="ai-performance"),
    path("matches/<int:match_id>/overview/", MatchOverviewView.as_view(), name="match-overview"),
    path("matches/<int:match_id>/dashboard/", MatchDashboardView.as_view(), name="match-dashboard"),
    path("matches/<int:match_id>/analysis/", MatchAnalysisView.as_view(), name="match-analysis"),
    path("matches/<int:match_id>/odds/", MatchOddsView.as_view(), name="match-odds"),
    path("odds/", OddsListView.as_view(), name="odds-list"),
    path("bookmakers/", BookmakersView.as_view(), name="bookmakers-list"),
    path("save/", SaveMatchView.as_view(), name="save-match"),
    path("saved/", SavedMatchesListView.as_view(), name="saved-matches"),
    path("save-market/", SaveMarketView.as_view(), name="save-market"),
    path("saved-markets/", SavedMarketsListView.as_view(), name="saved-markets"),
    path("saved-markets/pdf/", GenerateSavedMarketsPDFView.as_view(), name="generate-saved-markets-pdf"),
    path("finished/", FinishedMatchesView.as_view(), name="finished-matches"),
    path("sync-historical/", SyncHistoricalView.as_view(), name="sync-historical"),
    path("standings/", TeamStandingsView.as_view(), name="team-standings"),
    path("h2h/", HeadToHeadView.as_view(), name="head-to-head"),
    # AI Pick Feed + Result Recap + Accuracy Tracking
    path("ai-picks/", AIPickListView.as_view(), name="ai-picks"),
    path("ai-results/", AIResultRecapView.as_view(), name="ai-results"),
    path("ai-analytics/", AIAnalyticsView.as_view(), name="ai-analytics"),
]
