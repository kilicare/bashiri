import { apiClient } from "./client";
import { Match } from "./predictions";

export interface MicReaction {
  id: number;
  match: number;
  user: number;
  username: string;
  avatar_url: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  mood: string;
  team_side: string;
  is_fan_of_match: boolean;
  vote_count: number;
  user_voted: boolean;
  user_vote_emoji: string | null;
  vote_breakdown: Record<string, number>;
  created_at: string;
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

export function getUploadSignature() {
  return apiClient<UploadSignature>("/mic/upload-signature/");
}

export { uploadVideoResilient } from "@/lib/cloudinary-upload";
export type { CloudinaryUploadResult } from "@/lib/cloudinary-upload";

export function createMicReaction(payload: {
  match: number;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  mood: string;
  team_side: string;
  bytes?: number;
}) {
  return apiClient<MicReaction>("/mic/", { method: "POST", body: JSON.stringify(payload) });
}

export function getMicReactions(matchId: number, teamSide?: string) {
  const q = teamSide ? `?team_side=${teamSide}` : "";
  return apiClient<MicReaction[]>(`/mic/${matchId}/${q}`, { skipAuth: true });
}

export function getMoodSummary(matchId: number) {
  return apiClient<{ total: number; breakdown: Record<string, number> }>(`/mic/${matchId}/mood-summary/`, { skipAuth: true });
}

export function canPost(matchId: number) {
  return apiClient<{ can_post: boolean; reason?: string }>(`/mic/${matchId}/can-post/`, { skipAuth: true });
}

export function voteOnReaction(reactionId: number, emoji: string) {
  return apiClient(`/mic/reactions/${reactionId}/vote/`, { method: "POST", body: JSON.stringify({ emoji }) });
}

export function getFanOfMatch(matchId: number) {
  return apiClient<MicReaction>(`/mic/${matchId}/fan-of-match/`, { skipAuth: true }).catch(() => null);
}

export function getActiveMicMatches() {
  return apiClient<{ match: Match; reaction_count: number }[]>("/mic/active-matches/", { skipAuth: true });
}

export function getUserMicReactions() {
  return apiClient<MicReaction[]>("/mic/my-reactions/");
}

export function deleteMicReaction(reactionId: number) {
  return apiClient(`/mic/reactions/${reactionId}/`, { method: "DELETE" });
}