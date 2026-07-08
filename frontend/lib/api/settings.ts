import { apiClient } from "./client";
import { League, Team } from "./predictions";

export function getLeagues() {
  return apiClient<League[]>("/predictions/leagues/", { skipAuth: true });
}
export function getTeams(leagueCode?: string) {
  const q = leagueCode ? `?league=${leagueCode}` : "";
  return apiClient<Team[]>(`/predictions/teams/${q}`, { skipAuth: true });
}

export function getFavoriteTeams() {
  return apiClient<{ team_ids: number[] }>("/auth/favorite-teams/");
}
export function setFavoriteTeams(teamIds: number[]) {
  return apiClient<{ team_ids: number[] }>("/auth/favorite-teams/", {
    method: "PUT",
    body: JSON.stringify({ team_ids: teamIds }),
  });
}

export function getFavoriteLeagues() {
  return apiClient<{ league_ids: number[] }>("/auth/favorite-leagues/");
}
export function setFavoriteLeagues(leagueIds: number[]) {
  return apiClient<{ league_ids: number[] }>("/auth/favorite-leagues/", {
    method: "PUT",
    body: JSON.stringify({ league_ids: leagueIds }),
  });
}

export function updateLanguage(lang: "sw" | "en") {
  return apiClient("/auth/settings/", { method: "PATCH", body: JSON.stringify({ preferred_language: lang }) });
}
