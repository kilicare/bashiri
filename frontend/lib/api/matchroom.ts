import { apiClient } from "./client";

export interface RoomMessage {
  id: number;
  username: string;
  content: string;
  created_at: string;
}

export interface RoomHistoryResponse {
  room_state: string;
  messages: RoomMessage[];
  kickoff_at?: string;
}

export function getRoomHistory(matchId: number) {
  return apiClient<RoomHistoryResponse>(`/matchroom/${matchId}/history/`, { skipAuth: true });
}