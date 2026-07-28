"use client";
import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

/**
 * Inasajili Service Worker (sw.js) mara app inapopakia. Hii NDIYO
 * ilikuwa inakosekana — bila kuiita hii, sw.js haifanyi kazi kabisa
 * licha ya kuwepo kwenye /public.
 */
export function ServiceWorkerRegister() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[SW] Imesajiliwa:", registration.scope);

          // Check for updates immediately
          registration.update();

          // Wakati toleo jipya la sw.js linapopatikana
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // Toleo jipya limewekwa, lakini bado haija-activate
                // Onyesha notification kwa user
                setWaitingWorker(newWorker);
                setShowUpdate(true);
                console.log("[SW] Toleo jipya lipo, subiri user ku-update.");
              } else if (newWorker.state === "activated") {
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

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting and become active
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setShowUpdate(false);
      // Reload page to activate new service worker
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slideUp">
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-2xl p-4 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black mb-1">Toleo Jipya Lipo!</p>
            <p className="text-xs text-black/80 mb-3">Bashiri imesasishwa na maboresho mapya. Bonyeza ku-update.</p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-black/90 transition-colors"
              >
                Sasisha Sasa
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl bg-black/10 text-black text-xs font-bold hover:bg-black/20 transition-colors"
              >
                Baadaye
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center text-black/60 hover:bg-black/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
