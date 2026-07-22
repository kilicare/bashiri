"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, SquarePlus, X, Zap } from "lucide-react";
import { usePWAInstallStore } from "@/stores/pwaInstall.store";
import { snoozeInstallPrompt } from "@/lib/pwa-install-utils";

export function InstallPromptSheet() {
  const { isOpen, platform, deferredPrompt, close } = usePWAInstallStore();
  const installIconSrc = platform === "ios" ? "/apple-touch-icon.png" : "/icon-192.png";

  function handleDismiss() {
    snoozeInstallPrompt();
    close();
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) {
      handleDismiss();
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Bila kujali "accepted" au "dismissed" — heshimu chaguo, usimsumbue tena wiki hii
    snoozeInstallPrompt();
    close();
  }

  function handleIosUnderstood() {
    snoozeInstallPrompt();
    close();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.88)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden pb-safe"
            style={{
              background: "linear-gradient(180deg, #0F1F16 0%, var(--background) 55%)",
              border: "1px solid rgba(0,255,135,0.25)",
              borderBottom: "none",
              maxHeight: "82dvh",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
          >
            {/* Glow ya nyuma */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(0,255,135,0.35) 0%, transparent 70%)", filter: "blur(20px)" }}
            />

            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 relative z-10" style={{ background: "rgba(255,255,255,0.2)" }} />

            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <X size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>

            <div className="relative z-10 px-6 pt-8 pb-8 text-center">
              {/* Logo yenye pulse glow */}
              <motion.div
                className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #D4AF37, #CFAF7B)", boxShadow: "0 0 40px rgba(212,175,55,0.4)" }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={installIconSrc} alt="Bashiri" className="w-11 h-11" />
              </motion.div>

              <p className="text-sm text-white leading-6">
                Sakinisha Bashiri kwenye simu yako upate AI Picks za haraka, live scores, na
                notifications — bila kufungua browser kila wakati.
              </p>

              {platform === "android" && (
                <div className="space-y-3">
                  <button
                    onClick={handleAndroidInstall}
                    className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-black text-base"
                    style={{ background: "#00FF87", color: "#051006", boxShadow: "0 10px 30px rgba(0,255,135,0.4)" }}
                  >
                    <Download size={20} /> Sakinisha Sasa
                  </button>
                  <button onClick={handleDismiss} className="w-full py-2 text-sm font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Sio Sasa
                  </button>
                </div>
              )}

              {platform === "ios" && (
                <div>
                  <div
                    className="rounded-2xl p-5 mb-5 text-left space-y-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-xs" style={{ background: "rgba(0,255,135,0.15)", color: "#00FF87" }}>
                        1
                      </div>
                      <p className="text-sm text-white flex items-center gap-2">
                        Bonyeza
                        <motion.span
                          className="inline-flex w-7 h-7 rounded-lg items-center justify-center"
                          style={{ background: "rgba(0,122,255,0.15)" }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >
                          <Share size={14} style={{ color: "#0A84FF" }} />
                        </motion.span>
                        chini ya skrini
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-xs" style={{ background: "rgba(0,255,135,0.15)", color: "#00FF87" }}>
                        2
                      </div>
                      <p className="text-sm text-white flex items-center gap-2">
                        Chagua <SquarePlus size={16} style={{ color: "#00FF87" }} /> "Add to Home Screen"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleIosUnderstood}
                    className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-black text-base"
                    style={{ background: "#00FF87", color: "#051006", boxShadow: "0 10px 30px rgba(0,255,135,0.4)" }}
                  >
                    <Zap size={18} /> Nimeelewa
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
