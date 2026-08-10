import { apiClient } from "./client";

export interface Team {
  id: number;
  name: string;
  crest_url: string;
}
export interface League {
  id: number;
  code: string;
  name: string;
  poisson_key: string;
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

export function getFixtures(date?: string) {
  const query = date ? `?date=${date}` : "";
  return apiClient<Match[]>(`/predictions/fixtures/${query}`, { skipAuth: true });
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
export function getMatchOverview(matchId: number) {
  return apiClient<{
    match: Match;
    home_form: { sequence: string; avg_goals_scored: number; matches: any[] };
    away_form: { sequence: string; avg_goals_scored: number; matches: any[] };
    head_to_head: { date: string; home_team: string; away_team: string; home_score: number; away_score: number }[];
  }>(`/predictions/matches/${matchId}/overview/`, { skipAuth: true });
}

export interface MarketOption {
  key: string;
  label: string;
  prob: number | null;
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
}

export interface Dashboard {
  match_id: number;
  model_version: string;
  expected_goals: { home_xg: number; away_xg: number };
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
  return apiClient<any[]>("/predictions/saved/");
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
  };
  weekly: {
    accuracy_percentage: number;
    total_predictions: number;
    correct_predictions: number;
    high_confidence_accuracy: number;
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
}

export function getLeagues() {
  return apiClient<League[]>("/predictions/leagues/", { skipAuth: true });
}