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

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SW] Imesajiliwa:", registration.scope);

          // Wakati toleo jipya la sw.js linapopatikana, sasisha mara moja
          // (skipWaiting + clients.claim ndani ya sw.js vinashughulikia hii)
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                console.log("[SW] Toleo jipya limewashwa.");
              }
            });
          });
        })
        .catch((err) => {
          console.error("[SW] Imeshindwa kusajiliwa:", err);
        });
    });
  }, []);

  return null;
}
