"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BashiriUser {
  id: number;
  phone_number: string;
  username: string | null;
  date_of_birth: string | null;
  avatar_url: string;
  is_subscriber: boolean;
  is_subscription_active: boolean;
  subscription_expires_at: string | null;
  current_streak: number;
  best_streak: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
  profile_complete: boolean;
  preferred_language: "sw" | "en";
  favorite_team_ids: number[];
  favorite_league_ids: number[];
  date_joined: string;
}

interface AuthState {
  access: string | null;
  refresh: string | null;
  user: BashiriUser | null;
  setSession: (access: string, refresh: string, user: BashiriUser) => void;
  setUser: (user: BashiriUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      setSession: (access, refresh, user) => set({ access, refresh, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ access: null, refresh: null, user: null }),
    }),
    { name: "bashiri-auth" }
  )
);