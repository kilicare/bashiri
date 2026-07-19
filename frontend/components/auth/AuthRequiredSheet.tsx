"use client";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles, Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BashiriButton } from "@/components/ui/Button";
import { useAuthGateStore } from "@/stores/authGate.store";

export function AuthRequiredSheet() {
  const router = useRouter();
  const { isOpen, message, close } = useAuthGateStore();

  function handleLogin() {
    close();
    router.push("/login");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-[#111] rounded-3xl p-6 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Fungua Uwezo Wako</h2>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              {/* Modern gradient icon container */}
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 relative overflow-hidden"
                   style={{
                     background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)",
                     border: "1px solid rgba(212,175,55,0.2)"
                   }}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                <Lock size={32} style={{ color: "var(--brand-primary)" }} />
                <Sparkles size={16} className="absolute top-3 right-3" style={{ color: "var(--warning)" }} />
              </div>

              <p className="text-sm leading-relaxed max-w-[280px]"
                 style={{ color: "rgba(255,255,255,0.6)" }}>
                {message || "Jisajili kwa dakika chache ili upate uzoefu kamili wa Bashiri."}
              </p>
            </div>

            <BashiriButton
              onClick={handleLogin}
              size="lg"
              fullWidth
              style={{
                background: "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%)",
                boxShadow: "0 4px 20px rgba(212,175,55,0.3)"
              }}
            >
              <span className="flex items-center justify-center gap-2">
                Jisajili Sasa <LogIn size={18} />
              </span>
            </BashiriButton>

            {/* Subtle trust indicator */}
            <p className="text-[10px] mt-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              • Huru kabisa  • Dakika chache tu  • Hakuna card ya kadi
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
