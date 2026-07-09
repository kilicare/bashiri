/**
 * Return-to mechanism: kabla ya kuelekeza guest kwenye /login, tunahifadhi
 * "alikuwa wapi" kwenye sessionStorage. Baada ya login/onboarding
 * kukamilika, tunamrudisha huko moja kwa moja badala ya "/home" tu.
 */
const KEY = "bashiri_return_to";

export function saveReturnTo(path: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(KEY, path);
  }
}

export function consumeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  const val = sessionStorage.getItem(KEY);
  if (val) sessionStorage.removeItem(KEY);
  return val;
}
