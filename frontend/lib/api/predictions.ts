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
}

export function getFixtures() {
  return apiClient<Match[]>("/predictions/fixtures/", { skipAuth: true });
}
export function getLiveMatches() {
  return apiClient<Match[]>("/predictions/live/", { skipAuth: true });
}
export function getFinishedMatches(limit = 20, offset = 0, league?: string, team?: string) {
  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
  if (league) params.append("league", league);
  if (team) params.append("team", team);
  return apiClient<{ count: number; results: Match[] }>(`/predictions/finished/?${params}`, { skipAuth: true });
}
export function searchMatches(q: string) {
  return apiClient<{ results: Match[] }>(`/predictions/search/?q=${encodeURIComponent(q)}`, { skipAuth: true });
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
export interface Dashboard {
  match_id: number;
  model_version: string;
  expected_goals: { home_xg: number; away_xg: number };
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