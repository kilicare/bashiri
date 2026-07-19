/**
 * lib/pwa-install-utils.ts
 * Detection ya platform, hali ya standalone (tayari imesakinishwa),
 * na "snooze" ya siku 7 baada ya mtumiaji kubonyeza "Sio Sasa".
 */
const SNOOZE_KEY = "bashiri_install_prompt_snooze_until";
const SNOOZE_DAYS = 7;
const SESSION_SHOWN_KEY = "bashiri_install_prompt_shown_session";

export type PWAPlatform = "android" | "ios" | "other";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as any).standalone === true;
  return displayModeStandalone || iosStandalone;
}

export function detectPlatform(): PWAPlatform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

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
