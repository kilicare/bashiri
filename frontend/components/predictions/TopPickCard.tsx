"use client";
import { motion } from "framer-motion";
import { Lock, Sparkles, AlertCircle } from "lucide-react";
import { getConfidenceTier } from "@/lib/confidence-tiers";
import { TopPick } from "@/lib/api/predictions";
import { shouldReduceMotion } from "@/utils/animation";
import { useCountUp } from "@/hooks/useCountUp";

export function TopPickCard({ topPick, onLockedClick }: { topPick: TopPick; onLockedClick: () => void }) {
  const tier = getConfidenceTier(topPick.confidence);
  const isHighConfidence = topPick.confidence >= 80;
  const displayConfidence = useCountUp(topPick.confidence, 1000, shouldReduceMotion());
  
  // Handle NO_STRONG_PICK state
  const isNoPick = topPick.status === "NO_STRONG_PICK";

  return (
    <motion.button
      onClick={topPick.is_locked ? onLockedClick : undefined}
      className={`w-full text-left rounded-3xl p-5 mb-4 relative overflow-hidden ${isHighConfidence && !shouldReduceMotion() && !isNoPick ? 'high-confidence-glow' : ''}`}
      style={{
        background: isNoPick 
          ? `linear-gradient(135deg, rgba(255,100,100,0.1), #111111)`
          : `
          radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px),
          linear-gradient(135deg, ${tier.color}1A, #111111)
        `,
        backgroundSize: isNoPick ? "100% 100%" : "16px 16px, 100% 100%",
        border: isNoPick ? "1px solid rgba(255,100,100,0.3)" : `1px solid ${tier.color}44`
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow background layer for high confidence */}
      {isHighConfidence && !shouldReduceMotion() && !isNoPick && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${tier.color}15 0%, transparent 70%)`,
            animation: 'glow 2s ease-in-out infinite',
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {isNoPick ? (
            <AlertCircle size={16} style={{ color: "#ff6464" }} />
          ) : (
            <Sparkles size={16} style={{ color: tier.color }} />
          )}
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: isNoPick ? "#ff6464" : tier.color }}>
            {isNoPick ? "Hakuna Pick Iliyothibitishwa" : "Recommendation Kuu ya AI"}
          </span>
          {isHighConfidence && !topPick.is_locked && !isNoPick && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${tier.color}30`, color: tier.color }}>
              ⚡ HIGH
            </span>
          )}
        </div>

        {isNoPick ? (
          <>
            <p className="text-sm text-white mb-2">
              Hakuna soko lenye uhakika wa kutosha kwa mechi hii.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {topPick.reason || "Data quality haikidhi vigezo vya recommendation."}
            </p>
          </>
        ) : topPick.is_locked ? (
          <>
            <p className="text-3xl font-black mb-1" style={{ color: tier.color }}>{displayConfidence}%</p>
            <p className="text-sm text-white mb-2">AI ina uhakika mkubwa kwenye soko fulani — fungua uone ni lipi!</p>
            <div className="flex items-center gap-1.5">
              <Lock size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
              <span className="text-xs font-bold" style={{ color: "#FFD600" }}>Fungua kwa PRO</span>
            </div>
          </>
        ) : (
          <>
            <p className="text-3xl font-black mb-1" style={{ color: tier.color }}>{displayConfidence}%</p>
            <p className="text-sm font-bold text-white mb-0.5">{topPick.option_label}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{topPick.market_label}</p>
          </>
        )}

        {!isNoPick && (
          <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            {tier.emoji} {tier.label} — kati ya masoko yote 9 ya mechi hii
          </p>
        )}
      </div>
    </motion.button>
  );
}
