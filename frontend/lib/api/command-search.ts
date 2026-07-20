import { apiClient } from "./client";
import { Match, Team, League } from "./predictions";

export interface CommandSearchResults {
  matches: Match[];
  teams: Team[];
  leagues: League[];
}

export function commandSearch(query: string) {
  return apiClient<CommandSearchResults>(`/predictions/command-search/?q=${encodeURIComponent(query)}`, { skipAuth: true });
}
