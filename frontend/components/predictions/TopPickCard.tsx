"use client";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { getConfidenceTier } from "@/lib/confidence-tiers";
import { TopPick } from "@/lib/api/predictions";

export function TopPickCard({ topPick, onLockedClick }: { topPick: TopPick; onLockedClick: () => void }) {
  const tier = getConfidenceTier(topPick.confidence);

  return (
    <motion.button
      onClick={topPick.is_locked ? onLockedClick : undefined}
      className="w-full text-left rounded-3xl p-5 mb-4 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${tier.color}1A, #111111)`, border: `1px solid ${tier.color}44` }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} style={{ color: tier.color }} />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: tier.color }}>
          Recommendation Kuu ya AI
        </span>
      </div>

      {topPick.is_locked ? (
        <>
          <p className="text-3xl font-black mb-1" style={{ color: tier.color }}>{topPick.confidence}%</p>
          <p className="text-sm text-white mb-2">AI ina uhakika mkubwa kwenye soko fulani — fungua uone ni lipi!</p>
          <div className="flex items-center gap-1.5">
            <Lock size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span className="text-xs font-bold" style={{ color: "#FFD600" }}>Fungua kwa PRO</span>
          </div>
        </>
      ) : (
        <>
          <p className="text-3xl font-black mb-1" style={{ color: tier.color }}>{topPick.confidence}%</p>
          <p className="text-sm font-bold text-white mb-0.5">{topPick.option_label}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{topPick.market_label}</p>
        </>
      )}

      <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
        {tier.emoji} {tier.label} — kati ya masoko yote 9 ya mechi hii
      </p>
    </motion.button>
  );
}
