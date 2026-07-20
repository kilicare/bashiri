"use client";
import { create } from "zustand";
import {
  isSnoozed,
  isStandaloneMode,
  markShownThisSession,
  wasShownThisSession,
  PWAPlatform,
} from "@/lib/pwa-install-utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isOpen: boolean;
  platform: PWAPlatform;
  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void;
  setPlatform: (p: PWAPlatform) => void;
  /** Inajaribu kuonyesha sheet — inaheshimu snooze/session/standalone kiotomatiki. */
  attemptShow: () => void;
  close: () => void;
}

export const usePWAInstallStore = create<PWAInstallState>((set, get) => ({
  deferredPrompt: null,
  isOpen: false,
  platform: "other",

  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => set({ deferredPrompt: e }),
  setPlatform: (p) => set({ platform: p }),

  attemptShow: () => {
    const { platform, isOpen } = get();
    if (isOpen) return;
    if (isStandaloneMode()) return;
    if (isSnoozed()) return;
    if (wasShownThisSession()) return;
    if (platform !== "ios" && platform !== "android") return;

    markShownThisSession();
    set({ isOpen: true });
  },

  close: () => set({ isOpen: false }),
}));
