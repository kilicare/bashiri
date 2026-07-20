export type DevicePlatform = "android" | "ios" | "desktop" | "other";
export type DisplayMode = "standalone" | "fullscreen" | "minimal-ui" | "browser" | "unknown";

const hasWindow = (): boolean => typeof window !== "undefined";

export function detectDevicePlatform(): DevicePlatform {
  if (!hasWindow()) return "other";

  const ua = window.navigator.userAgent || window.navigator.vendor || "";
  const isIos = /iPad|iPhone|iPod/i.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  if (isIos) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function getDisplayMode(): DisplayMode {
  if (!hasWindow()) return "unknown";
  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  return "browser";
}

interface IosNavigator extends Navigator {
  standalone?: boolean;
}

export function isStandalone(): boolean {
  if (!hasWindow()) return false;
  const navigatorWithStandalone = window.navigator as IosNavigator;
  return getDisplayMode() === "standalone" || navigatorWithStandalone.standalone === true;
}

interface MSNavigator extends Navigator {
  msMaxTouchPoints?: number;
}

export function isTouchDevice(): boolean {
  if (!hasWindow()) return false;
  const navigatorWithMs = window.navigator as MSNavigator;
  return (
    "ontouchstart" in window ||
    window.navigator.maxTouchPoints > 0 ||
    (navigatorWithMs.msMaxTouchPoints ?? 0) > 0
  );
}

export const isAndroid = (): boolean => detectDevicePlatform() === "android";
export const isIos = (): boolean => detectDevicePlatform() === "ios";
export const isDesktop = (): boolean => detectDevicePlatform() === "desktop";
