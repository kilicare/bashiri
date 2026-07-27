/**
 * lib/toast-utils.ts
 *
 * Inagundua "Failed to fetch" (na variants zake kwenye browsers
 * tofauti) na kuonyesha toast nyekundu ya juu ("Hakuna Mtandao").
 * HII HAIBADILISHI ujumbe wa error uliopo tayari (setError HTML) —
 * ni NYONGEZA ya juu ya skrini pekee, kwa hali ya network error tu.
 */
import { toast } from "sonner";

const NETWORK_ERROR_PATTERNS = [
  "failed to fetch",          // Chrome, Edge, Samsung Internet
  "networkerror",              // Firefox
  "load failed",                // Safari
  "network request failed",    // React Native/generic
];

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => msg.includes(pattern));
}

export function showNetworkErrorToast() {
  toast.error("Hakuna Mtandao", {
    description: "Tafadhali unganisha na mtandao wako kisha jaribu tena.",
    duration: 5000,
  });
}
