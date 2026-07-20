"use client";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Zap, X } from "lucide-react";
import { BashiriButton } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const LOCKED_FEATURES = [
  "Double Chance (1X, X2, 12)",
  "Draw No Bet",
  "Over/Under 0.5, 1.5, 3.5, 4.5",
  "AI Chat bila kikomo (50/siku)",
];

const PLANS = [
  { key: "weekly", label: "Wiki 1", price: "TZS 1,500", popular: false },
  { key: "monthly", label: "Mwezi 1", price: "TZS 6,000", popular: true },
];

export function SubscriptionSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState("monthly");
  const currentSearch = searchParams.toString();
  const returnTo = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-[#111] rounded-3xl p-6 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap size={16} style={{ color: "var(--warning)" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--warning)" }}>Bashiri PRO</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="text-2xl font-black text-white mb-5">Fungua Masoko Yote</h2>

            <div className="space-y-2 mb-5">
              {LOCKED_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.15)" }}>
                    <Check size={11} style={{ color: "var(--brand-primary)" }} />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{f}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mb-5">
              {PLANS.map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setSelected(plan.key)}
                  className="flex-1 rounded-2xl p-3 text-center relative"
                  style={{
                    background: selected === plan.key ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.04)",
                    border: selected === plan.key ? "2px solid var(--brand-primary)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "var(--warning)", color: "#000" }}>
                      MAARUFU
                    </span>
                  )}
                  <p className="text-sm font-bold text-white">{plan.label}</p>
                  <p className="text-lg font-black mt-0.5" style={{ color: "var(--brand-primary)" }}>{plan.price}</p>
                </button>
              ))}
            </div>

            <BashiriButton
              size="lg"
              fullWidth
              onClick={() => router.push(`/subscribe?plan=${selected}&return_to=${encodeURIComponent(returnTo)}`)}
            >
              Lipa kwa M-Pesa →
            </BashiriButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}