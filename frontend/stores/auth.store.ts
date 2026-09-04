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
  onboarding_status: "not_started" | "completed" | "skipped";
  onboarding_completed_at: string | null;
  tip_preferences: string[];
  preferred_language: "sw" | "en";
  favorite_team_ids: number[];
  favorite_league_ids: number[];
  date_joined: string;
  is_staff: boolean;
  // Tip-specific fields
  tip_count: number;
  tip_accuracy: number;
  verified_tipster: boolean;
  followers_count: number;
  following_count: number;
}

interface AuthState {
  access: string | null;
  refresh: string | null;
  user: BashiriUser | null;
  hasHydrated: boolean;
  isUserLoading: boolean;
  setSession: (access: string, refresh: string, user: BashiriUser) => void;
  setUser: (user: BashiriUser) => void;
  setUserLoading: (loading: boolean) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      hasHydrated: false,
      isUserLoading: false,
      setSession: (access, refresh, user) => set({ access, refresh, user, isUserLoading: false }),
      setUser: (user) => set({ user }),
      setUserLoading: (isUserLoading) => set({ isUserLoading }),
      logout: () => set({ access: null, refresh: null, user: null, isUserLoading: false }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "bashiri-auth",
      partialize: (state) => ({ access: state.access, refresh: state.refresh }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);