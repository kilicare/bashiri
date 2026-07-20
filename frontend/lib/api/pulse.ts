import { apiClient } from "./client";

export interface PulseSummary {
  stats: {
    live_rooms: number;
    mic_videos_today: number;
    open_debates: number;
    ai_weekly_accuracy: number | null;
  };
  mic: {
    featured_reactions: {
      id: number; match_id: number; video_url: string; username: string;
      mood: string; home_team: string; away_team: string;
    }[];
    active_matches_count: number;
  };
  rooms: {
    live_matches: {
      id: number; home_team: string; away_team: string; league: string;
      home_score: number | null; away_score: number | null;
    }[];
  };
  debates: {
    open: {
      id: number; question: string; options: string[];
      tallies: Record<string, number>; vote_count: number; closes_at: string;
    }[];
  };
  track_record: {
    weekly_trend: { week_start: string; accuracy_percentage: number }[];
    latest_accuracy: number | null;
  };
  derby: { derby_name: string; home_team: string; away_team: string; theme_accent_color: string } | null;
}

export function getPulseSummary() {
  return apiClient<PulseSummary>("/pulse/summary/", { skipAuth: true });
}
