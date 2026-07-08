import { apiClient } from "./client";

export interface MatchHubBadges {
  room_state: "watch_party" | "live" | "closed";
  room_message_count: number;
  mic_reaction_count: number;
  mic_can_post: boolean;
  has_open_debate: boolean;
}

export async function getMatchHubBadges(matchId: number): Promise<MatchHubBadges> {
  const [roomHistory, micReactions, micStatus] = await Promise.all([
    apiClient<{ room_state: string; messages: any[] }>(`/matchroom/${matchId}/history/`, { skipAuth: true }),
    apiClient<any[]>(`/mic/${matchId}/`, { skipAuth: true }).catch(() => []),
    apiClient<{ can_post: boolean }>(`/mic/${matchId}/can-post/`, { skipAuth: true }).catch(() => ({ can_post: false })),
  ]);

  return {
    room_state: roomHistory.room_state as any,
    room_message_count: roomHistory.messages.length,
    mic_reaction_count: micReactions.length,
    mic_can_post: micStatus.can_post,
    has_open_debate: false, // itaboreshwa Phase 8 na endpoint maalum ikiwa inahitajika
  };
}
