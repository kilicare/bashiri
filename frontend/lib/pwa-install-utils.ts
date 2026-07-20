/**
 * lib/pwa-install-utils.ts
 * Detection ya platform, hali ya standalone (tayari imesakinishwa),
 * na "snooze" ya siku 7 baada ya mtumiaji kubonyeza "Sio Sasa".
 */
import { detectDevicePlatform, isStandalone } from "@/lib/device-utils";

const SNOOZE_KEY = "bashiri_install_prompt_snooze_until";
const SNOOZE_DAYS = 7;
const SESSION_SHOWN_KEY = "bashiri_install_prompt_shown_session";

export type PWAPlatform = "android" | "ios" | "desktop" | "other";

export function detectPlatform(): PWAPlatform {
  const platform = detectDevicePlatform();
  return platform === "desktop" ? "other" : platform;
}

export function isStandaloneMode(): boolean {
  return isStandalone();
}

export { isStandalone };

export function isSnoozed(): boolean {
  if (typeof window === "undefined") return true;
  const until = localStorage.getItem(SNOOZE_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

export function snoozeInstallPrompt() {
  const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(SNOOZE_KEY, String(until));
}

export function markShownThisSession() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
  }
}

export function wasShownThisSession(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_SHOWN_KEY) === "1";
}
