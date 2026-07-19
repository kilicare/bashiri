"use client";
import { create } from "zustand";
import {
  isSnoozed,
  isStandalone,
  markShownThisSession,
  wasShownThisSession,
  PWAPlatform,
} from "@/lib/pwa-install-utils";

interface PWAInstallState {
  deferredPrompt: any;
  isOpen: boolean;
  platform: PWAPlatform;
  setDeferredPrompt: (e: any) => void;
  setPlatform: (p: PWAPlatform) => void;
  /** Inajaribu kuonyesha sheet — inaheshimu snooze/session/standalone kiotomatiki. */
  attemptShow: () => void;
  close: () => void;
}

export const usePWAInstallStore = create<PWAInstallState>((set, get) => ({
  deferredPrompt: null,
  isOpen: false,
  platform: "other",

  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  setPlatform: (p) => set({ platform: p }),

  attemptShow: () => {
    const { platform, isOpen } = get();
    if (isOpen) return;
    if (isStandalone()) return;
    if (isSnoozed()) return;
    if (wasShownThisSession()) return;
    if (platform !== "ios" && platform !== "android") return;

    markShownThisSession();
    set({ isOpen: true });
  },

  close: () => set({ isOpen: false }),
}));
