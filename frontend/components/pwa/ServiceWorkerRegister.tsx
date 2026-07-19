"use client";
import { useEffect } from "react";

/**
 * Inasajili Service Worker (sw.js) mara app inapopakia. Hii NDIYO
 * ilikuwa inakosekana — bila kuiita hii, sw.js haifanyi kazi kabisa
 * licha ya kuwepo kwenye /public.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register immediately, don't wait for load event
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none" // Force fresh service worker
      })
      .then((registration) => {
        console.log("[SW] Imesajiliwa:", registration.scope);

        // Force the service worker to claim clients immediately
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Wakati toleo jipya la sw.js linapopatikana, sasisha mara moja
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available, force update
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
            if (newWorker.state === "activated") {
              console.log("[SW] Toleo jipya limewashwa.");
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => {
        console.error("[SW] Imeshindwa kusajiliwa:", err);
      });
  }, []);

  return null;
}
