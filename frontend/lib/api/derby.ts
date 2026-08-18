import { apiClient } from "./client";

export interface ActiveDerby {
  id?: number;
  home_team?: number;
  home_team_detail?: { id: number; name: string; crest_url: string };
  away_team?: number;
  away_team_detail?: { id: number; name: string; crest_url: string };
  match_id?: number | null;
  derby_name?: string;
  starts_at?: string;
  ends_at?: string;
  theme_accent_color?: string;
  banner_text?: string;
  head_to_head?: Array<{ date: string; home_score: number; away_score: number }>;
}

export interface ActiveDerbyResponse {
  active: boolean;
  derbies: ActiveDerby[];
}

export function getActiveDerby() {
  return apiClient<ActiveDerbyResponse>("/predictions/active-derby/", { skipAuth: true });
}