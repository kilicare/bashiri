"use client";
import { useEffect, useRef } from "react";
import { usePWAInstallStore } from "@/stores/pwaInstall.store";
import { detectPlatform } from "@/lib/pwa-install-utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const TIME_TRIGGER_MS = 90 * 1000; // dakika 1.5 — trigger ya "muda"

/**
 * Mounted mara moja kwenye (main)/layout.tsx. Inashika beforeinstallprompt
 * (Android), inaanzisha timer ya dakika 1.5 — trigger ya "kitendo" (Save/
 * Share) inaita attemptShow() kutoka kwenye pages zenyewe. "Best of" —
 * chochote kinachotokea kwanza kinaonyesha sheet, tukio la pili
 * halionyeshi tena (session guard iko ndani ya attemptShow()).
 */
export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const setDeferredPrompt = usePWAInstallStore((s) => s.setDeferredPrompt);
  const setPlatform = usePWAInstallStore((s) => s.setPlatform);
  const attemptShow = usePWAInstallStore((s) => s.attemptShow);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());

    function handleBeforeInstallPrompt(e: Event) {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);

    timerRef.current = setTimeout(() => attemptShow(), TIME_TRIGGER_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
