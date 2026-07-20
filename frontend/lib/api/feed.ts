import { apiClient } from "./client";

export interface Card {
  id: number;
  type: string;
  match_id: number | null;
  data: any;
  created_at: string;
}

export function getFeed(limit = 20, offset = 0) {
  return apiClient<{ count: number; results: Card[] }>(`/feed/?limit=${limit}&offset=${offset}`, { skipAuth: true });
}

export function voteOnPoll(cardId: number, choice: string) {
  return apiClient(`/feed/polls/${cardId}/vote/`, { method: "POST", body: JSON.stringify({ choice }) });
}

export function getDebates(status?: "open" | "closed") {
  const q = status ? `?status=${status}` : "";
  return apiClient<Card[]>(`/feed/debates/${q}`, { skipAuth: true });
}