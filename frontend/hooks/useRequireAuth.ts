"use client";
import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useAuthGateStore } from "@/stores/authGate.store";
import { saveReturnTo } from "@/lib/return-to";

/**
 * Guard ya kitendo (SI ya ukurasa mzima). Mfano: kabla ya Save Match,
 * Share, Post Mic, Vote — itaje requireAuth() kwanza. Guest anaona
 * "Ingia Kwanza" bottom-sheet badala ya kupelekwa /login ghafla.
 */
export function useRequireAuth() {
  const access = useAuthStore((s) => s.access);
  const openGate = useAuthGateStore((s) => s.open);

  const requireAuth = useCallback((message?: string): boolean => {
    if (access) return true;
    if (typeof window !== "undefined") {
      saveReturnTo(window.location.pathname);
    }
    openGate(message);
    return false;
  }, [access, openGate]);

  return { requireAuth, isAuthed: !!access };
}
