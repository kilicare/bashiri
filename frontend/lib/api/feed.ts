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

export function createUserPrediction(payload: {
  match: number;
  market: string;
  selection: string;
  note: string;
  emoji: string;
}) {
  return apiClient("/feed/predictions/", { method: "POST", body: JSON.stringify(payload) });
}

export function voteOnPoll(cardId: number, choice: string) {
  return apiClient(`/feed/polls/${cardId}/vote/`, { method: "POST", body: JSON.stringify({ choice }) });
}

export function getLeaderboard(period: "weekly" | "monthly" | "all" = "all") {
  return apiClient<{ period: string; results: any[] }>(`/feed/leaderboard/?period=${period}`, { skipAuth: true });
}

export function getMyPredictions() {
  return apiClient<any[]>("/feed/my-predictions/");
}

export function deleteMyPrediction(predictionId: number) {
  return apiClient("/feed/my-predictions/", { method: "DELETE", body: JSON.stringify({ prediction_id: predictionId }) });
}