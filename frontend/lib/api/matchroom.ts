import { apiClient } from "./client";

export interface RoomMessage {
  id: number;
  username: string;
  content: string;
  created_at: string;
}

export function getRoomHistory(matchId: number) {
  return apiClient<{ room_state: string; messages: RoomMessage[] }>(`/matchroom/${matchId}/history/`, { skipAuth: true });
}