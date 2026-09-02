import { apiClient } from "./client";

export interface Team {
  id: number;
  name: string;
  crest_url: string;
  league?: League;
}
export interface League {
  id: number;
  code: string;
  name: string;
  poisson_key: string;
  logo_url: string;
  is_active: boolean;
}
export interface Match {
  id: number;
  league: League;
  home_team: Team;
  away_team: Team;
  kickoff_at: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
  home_score: number | null;
  away_score: number | null;
  is_big_match: boolean;
  stage: string;
  stage_display: string;
  group_name: string;
  matchday?: number | null;
}

export function getFixtures(date?: string, range?: string, offset?: number, limit?: number, league?: string) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (range) params.append("range", range);
  if (offset !== undefined) params.append("offset", offset.toString());
  if (limit !== undefined) params.append("limit", limit.toString());
  if (league) params.append("league", league);
  const query = params.toString();
  return apiClient<Match[]>(`/predictions/fixtures/${query ? '?' + query : ''}`, { skipAuth: true });
}
export function getLiveMatches() {
  return apiClient<Match[]>("/predictions/live/", { skipAuth: true });
}
export function getFinishedMatches(limit = 20, offset = 0, league?: string, team?: string, date?: string) {
  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
  if (league) params.append("league", league);
  if (team) params.append("team", team);
  if (date) params.append("date", date);
  return apiClient<{ count: number; results: Match[] }>(`/predictions/finished/?${params}`, { skipAuth: true });
}
export function searchMatches(q: string, date?: string, league?: string) {
  const params = new URLSearchParams({ q });
  if (date) params.append("date", date);
  if (league) params.append("league", league);
  return apiClient<{ results: Match[] }>(`/predictions/search/?${params}`, { skipAuth: true });
}
export function getMatchOverview(matchId: number, formRange?: number, h2hRange?: number) {
  const params = new URLSearchParams();
  if (formRange) params.append("form_range", formRange.toString());
  if (h2hRange) params.append("h2h_range", h2hRange.toString());
  const query = params.toString();
  return apiClient<{
    match: Match;
    home_form: { sequence: string; avg_goals_scored: number; matches: Array<{ opponent: string; result: string; date: string }> };
    away_form: { sequence: string; avg_goals_scored: number; matches: Array<{ opponent: string; result: string; date: string }> };
    head_to_head: { date: string; home_team: string; away_team: string; home_score: number; away_score: number }[];
  }>(`/predictions/matches/${matchId}/overview/${query ? '?' + query : ''}`, { skipAuth: true });
}

export interface MarketOption {
  key: string;
  label: string;
  prob: number | null;
  extra?: {
    rank?: number;
    home_goals?: number;
    away_goals?: number;
  };
}
export interface Market {
  key: string;
  label: string;
  is_locked: boolean;
  is_free: boolean;
  confidence: number | null;
  ai_pick: string | null;
  options: MarketOption[];
}

export interface TopPick {
  is_locked: boolean;
  confidence: number;
  market_label: string | null;
  option_label: string | null;
  status?: "STRONG" | "NO_STRONG_PICK";
  tier?: "STRONG" | "ELITE" | null;
  data_quality?: "HIGH" | "MEDIUM" | "LOW";
  model_version?: string;
  reason?: string;
}

export interface Dashboard {
  match_id: number;
  model_version: string;
  expected_goals: { home_xg: number; away_xg: number; total_xg: number };
  top_pick: TopPick;
  markets: Market[];
  match: Match;
}

export function getMatchDashboard(matchId: number) {
  return apiClient<Dashboard>(`/predictions/matches/${matchId}/dashboard/`);
}
export function saveMatch(matchId: number) {
  return apiClient("/predictions/save/", { method: "POST", body: JSON.stringify({ match_id: matchId }) });
}
export function getSavedMatches() {
  return apiClient<Array<{ match_id: number; home_team: string; away_team: string; saved_at: string }>>("/predictions/saved/");
}
export function saveMarket(matchId: number, marketKey: string) {
  return apiClient("/predictions/save-market/", { method: "POST", body: JSON.stringify({ match_id: matchId, market_key: marketKey }) });
}
export function unsaveMarket(matchId: number, marketKey: string) {
  return apiClient("/predictions/save-market/", { method: "DELETE", body: JSON.stringify({ match_id: matchId, market_key: marketKey }) });
}
export function getSavedMarkets(matchId?: number) {
  const query = matchId ? `?match_id=${matchId}` : "";
  return apiClient<any[]>(`/predictions/saved-markets/${query}`);
}
export function generateSavedMarketsPDF(tabName: string) {
  return apiClient("/predictions/saved-markets/pdf/", { 
    method: "POST", 
    body: JSON.stringify({ tab_name: tabName }),
    responseType: 'blob'
  });
}

export interface MarketOptionAnalysis {
  key: string;
  label: string;
  prob: number | null;
  was_actual_outcome: boolean | null;
  extra?: {
    rank?: number;
    home_goals?: number;
    away_goals?: number;
  };
}
export interface MarketAnalysis {
  key: string;
  label: string;
  is_locked: boolean;
  is_free: boolean;
  ai_pick: string | null;
  ai_was_correct: boolean | null;
  options: MarketOptionAnalysis[];
}
export interface MatchAnalysis {
  model_version: string;
  ai_scorecard: { correct: number; total: number };
  expected_goals: { home_xg: number; away_xg: number };
  actual_score: { home: number; away: number };
  markets: MarketAnalysis[];
  match: Match;
}

export function getMatchAnalysis(matchId: number) {
  return apiClient<MatchAnalysis>(`/predictions/matches/${matchId}/analysis/`);
}

export interface AITrackRecordMarketStat {
  correct: number;
  total: number;
  accuracy_percentage: number;
}
export interface AITrackRecord {
  generated_at: string;
  scope: string;
  markets: Record<string, AITrackRecordMarketStat>;
  weekly_trend: { week_start: string; accuracy_percentage: number }[];
  boldest_calls: {
    match_id: number;
    home_team: string;
    away_team: string;
    ai_confidence: number;
    ai_predicted: string;
    date: string;
  }[];
}

export function getAITrackRecord(league?: string) {
  const q = league ? `?league=${league}` : "";
  return apiClient<AITrackRecord>(`/predictions/ai-track-record/${q}`, { skipAuth: true });
}

export interface AIPerformanceStats {
  daily: {
    accuracy_percentage: number;
    total_predictions: number;
    correct_predictions: number;
    high_confidence_accuracy: number;
    market_accuracy: {
      "1x2": number | null;
      "btts": number | null;
      "over_under": number | null;
      "double_chance": number | null;
      "over_under_15": number | null;
      "home_goals": number | null;
      "away_goals": number | null;
    };
    market_counts: {
      "1x2": number;
      "btts": number;
      "over_under": number;
      "double_chance": number;
      "over_under_15": number;
      "home_goals": number;
      "away_goals": number;
    };
    current_streak: number;
    best_streak: number;
  };
  weekly: {
    accuracy_percentage: number;
    total_predictions: number;
    correct_predictions: number;
    high_confidence_accuracy: number;
    market_accuracy: {
      "1x2": number | null;
      "btts": number | null;
      "over_under": number | null;
      "double_chance": number | null;
      "over_under_15": number | null;
      "home_goals": number | null;
      "away_goals": number | null;
    };
    market_counts: {
      "1x2": number;
      "btts": number;
      "over_under": number;
      "double_chance": number;
      "over_under_15": number;
      "home_goals": number;
      "away_goals": number;
    };
    best_streak: number;
  };
  all_time: {
    accuracy_percentage: number;
    total_predictions: number;
    correct_predictions: number;
    high_confidence_accuracy: number;
  };
  weekly_trend: {
    date: string;
    accuracy_percentage: number;
    total_predictions: number;
  }[];
}

export function getAIPerformanceStats() {
  return apiClient<AIPerformanceStats>("/predictions/ai-performance/", { skipAuth: true });
}

export interface League {
  id: number;
  code: string;
  name: string;
  poisson_key: string;
  logo_url: string;
  is_active: boolean;
}

export function getLeagues() {
  return apiClient<League[]>("/predictions/leagues/", { skipAuth: true });
}

// Odds API types
export interface OddsBookmaker {
  id: number;
  match: Match;
  bookmaker_name: string;
  market_type: string;
  market_label: string;
  home_win_odds: number | string | null;
  draw_odds: number | string | null;
  away_win_odds: number | string | null;
  over_odds: number | string | null;
  under_odds: number | string | null;
  btts_yes_odds: number | string | null;
  btts_no_odds: number | string | null;
  last_updated: string;
  is_live: boolean;
}

export interface MatchOddsResponse {
  match: {
    id: number;
    home_team: string;
    away_team: string;
    kickoff_at: string;
    status: string;
  };
  odds: OddsBookmaker[];
  history: Array<{
    bookmaker: string;
    market_type: string;
    home_win_odds: number | null;
    draw_odds: number | null;
    away_win_odds: number | null;
    timestamp: string;
  }>;
}

export interface Bookmaker {
  name: string;
  leagues: string[];
}

export function getOdds(league?: string, status?: string, lang?: string) {
  const params = new URLSearchParams();
  if (league) params.append("league", league);
  if (status) params.append("status", status);
  if (lang) params.append("lang", lang);
  const query = params.toString();
  return apiClient<OddsBookmaker[]>(`/predictions/odds/${query ? '?' + query : ''}`, { skipAuth: true });
}

export function getMatchOdds(matchId: number, lang?: string) {
  const params = new URLSearchParams();
  if (lang) params.append("lang", lang);
  const query = params.toString();
  return apiClient<MatchOddsResponse>(`/predictions/matches/${matchId}/odds/${query ? '?' + query : ''}`, { skipAuth: true });
}

export function getBookmakers() {
  return apiClient<Bookmaker[]>("/predictions/bookmakers/", { skipAuth: true });
}

// Team and League Detail API types
export interface TeamStanding {
  id: number;
  team: Team;
  league: League;
  position: number;
  matches_played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string | null;
  form_rating: number;
  updated_at: string;
}

export interface TeamDetail {
  team: Team;
  league: League | null;
  standings: TeamStanding | null;
  upcoming_matches: Match[];
  finished_matches: Match[];
}

export interface LeagueDetail {
  league: League;
  standings: TeamStanding[];
  upcoming_matches: Match[];
  finished_matches: Match[];
  teams: Team[];
}

export function getTeamDetail(teamId: number) {
  return apiClient<TeamDetail>(`/predictions/teams/${teamId}/`, { skipAuth: true });
}

export function getLeagueDetail(leagueCode: string) {
  return apiClient<LeagueDetail>(`/predictions/leagues/${leagueCode}/`, { skipAuth: true });
}

// AI Pick Feed + Result Recap + Accuracy Tracking API types
export interface AIPick {
  pick_id: string;
  match_id: number;
  home_team: string;
  away_team: string;
  league: string;
  kickoff_at: string;
  market: string;
  market_label: string;
  selection: string;
  selection_label: string;
  probability: number;
  probability_percent: number;
  tier: "ELITE" | "STRONG" | "MINIMUM";
  feed: "STANDARD" | "PREMIUM";
  status: "PENDING" | "LIVE" | "WON" | "LOST" | "PUSH" | "VOID" | "CANCELLED";
  created_at: string;
  published_at: string | null;
  settled_at: string | null;
  actual_home_score: number | null;
  actual_away_score: number | null;
  result: string | null;
}

export interface AIPickListResponse {
  count: number;
  limit: number;
  offset: number;
  results: AIPick[];
}

export function getAIPicks(params?: {
  feed?: "STANDARD" | "PREMIUM";
  tier?: "ELITE" | "STRONG" | "MINIMUM";
  status?: "PENDING" | "LIVE" | "WON" | "LOST" | "PUSH";
  date?: string;
  range?: "today" | "yesterday" | "this_week" | "last_7_days" | "this_month";
  league?: string;
  market?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params?.feed) query.append("feed", params.feed);
  if (params?.tier) query.append("tier", params.tier);
  if (params?.status) query.append("status", params.status);
  if (params?.date) query.append("date", params.date);
  if (params?.range) query.append("range", params.range);
  if (params?.league) query.append("league", params.league);
  if (params?.market) query.append("market", params.market);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  return apiClient<AIPickListResponse>(`/predictions/ai-picks/${query ? '?' + query : ''}`, { skipAuth: true });
}

export interface AIResultRecap {
  range: string;
  total_picks: number;
  settled: number;
  pending: number;
  live: number;
  won: number;
  lost: number;
  push: number;
  void: number;
  hit_rate: number;
  win_rate: number;
  settlement_rate: number;
}

export function getAIResultRecap(params?: {
  range?: "today" | "yesterday" | "this_week" | "last_7_days" | "this_month" | "custom";
  start_date?: string;
  end_date?: string;
  tier?: "ELITE" | "STRONG" | "MINIMUM";
  feed?: "STANDARD" | "PREMIUM";
  league?: string;
  market?: string;
}) {
  const query = new URLSearchParams();
  if (params?.range) query.append("range", params.range);
  if (params?.start_date) query.append("start_date", params.start_date);
  if (params?.end_date) query.append("end_date", params.end_date);
  if (params?.tier) query.append("tier", params.tier);
  if (params?.feed) query.append("feed", params.feed);
  if (params?.league) query.append("league", params.league);
  if (params?.market) query.append("market", params.market);
  return apiClient<AIResultRecap>(`/predictions/ai-results/${query ? '?' + query : ''}`, { skipAuth: true });
}

export interface AIAnalytics {
  range: string;
  total_picks: number;
  market_breakdown?: Array<{
    market: string;
    market_label: string;
    picks: number;
    won: number;
    lost: number;
    hit_rate: number;
  }>;
  tier_breakdown?: Array<{
    tier: string;
    picks: number;
    won: number;
    lost: number;
    hit_rate: number;
  }>;
  league_breakdown?: Array<{
    league: string;
    league_name: string;
    picks: number;
    won: number;
    lost: number;
    hit_rate: number;
  }>;
}

export function getAIAnalytics(params?: {
  range?: "today" | "yesterday" | "this_week" | "last_7_days" | "this_month";
  breakdown?: "market" | "tier" | "league" | "all";
}) {
  const query = new URLSearchParams();
  if (params?.range) query.append("range", params.range);
  if (params?.breakdown) query.append("breakdown", params.breakdown);
  return apiClient<AIAnalytics>(`/predictions/ai-analytics/${query ? '?' + query : ''}`, { skipAuth: true });
}