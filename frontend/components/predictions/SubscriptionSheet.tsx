"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BashiriButton } from "@/components/ui/Button";

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
  const [selected, setSelected] = useState("monthly");

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        <Zap size={16} style={{ color: "#FFD600" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#FFD600" }}>Bashiri PRO</span>
      </div>
      <h2 className="text-2xl font-black text-white mb-5">Fungua Masoko Yote</h2>

      <div className="space-y-2 mb-5">
        {LOCKED_FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(245,166,35,0.15)" }}>
              <Check size={11} style={{ color: "#F5A623" }} />
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
              background: selected === plan.key ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.04)",
              border: selected === plan.key ? "2px solid #F5A623" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "#FFD600", color: "#000" }}>
                MAARUFU
              </span>
            )}
            <p className="text-sm font-bold text-white">{plan.label}</p>
            <p className="text-lg font-black mt-0.5" style={{ color: "#F5A623" }}>{plan.price}</p>
          </button>
        ))}
      </div>

      <BashiriButton className="w-full mb-6" size="lg" onClick={() => router.push(`/subscribe?plan=${selected}`)}>
        Lipa kwa M-Pesa →
      </BashiriButton>
    </BottomSheet>
  );
}