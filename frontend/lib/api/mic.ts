import { apiClient } from "./client";

export interface MicReaction {
  id: number;
  match: number;
  user: number;
  username: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  mood: string;
  team_side: string;
  is_fan_of_match: boolean;
  vote_count: number;
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

export async function uploadVideoToCloudinary(file: Blob, sig: UploadSignature, retries = 2): Promise<{ secure_url: string; duration: number }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.api_key);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return { secure_url: data.secure_url, duration: Math.round(data.duration || 0) };
    } catch (e) {
      if (attempt === retries) throw new Error("Imeshindwa kupakia video baada ya majaribio kadhaa. Angalia mtandao wako.");
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw new Error("Upload failed");
}

export function createMicReaction(payload: {
  match: number;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  mood: string;
  team_side: string;
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