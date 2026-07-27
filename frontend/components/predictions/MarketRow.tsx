"use client";
import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Market } from "@/lib/api/predictions";
import { getConfidenceColor } from "@/lib/confidence-tiers";

export function MarketRow({ market, onLockedClick }: { market: Market; onLockedClick: () => void }) {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
      whileTap={{ scale: 0.99 }}
      onClick={market.is_locked ? onLockedClick : undefined}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="text-sm font-bold text-white">{market.label}</span>
        {market.is_locked ? (
          <div className="flex items-center gap-1.5">
            <Lock size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span className="text-xs font-bold" style={{ color: "#FFD600" }}>PRO</span>
          </div>
        ) : market.ai_pick ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,135,0.1)", color: "#00FF87" }}>
            AI Pick ✓
          </span>
        ) : null}
      </div>

      <div className="p-4 space-y-2">
        {market.options.map((opt) => {
          // MUHIMU: rangi sasa inategemea ASILIMIA HALISI ya option hii
          // (tier-based), SI nafasi yake kwenye orodha — hivyo "chini"
          // itaonekana nyekundu KILA WAKATI, "juu" kijani, bila kujali
          // ni Home/Draw/Away au chaguo lipi.
          const colorForOption = market.is_locked ? "rgba(255,255,255,0.2)" : getConfidenceColor((opt.prob || 0) * 100);
          return (
            <div key={opt.key} className="flex items-center gap-3">
              {market.is_locked ? (
                <>
                  <span className="text-xs w-24 truncate" style={{ color: "rgba(255,255,255,0.3)", filter: "blur(3px)" }}>{opt.label}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", filter: "blur(2px)" }} />
                  <span className="text-xs font-bold w-10 text-right" style={{ color: "rgba(255,255,255,0.2)", filter: "blur(3px)" }}>??%</span>
                </>
              ) : (
                <>
                  <span className="text-xs w-24 truncate" style={{ color: "rgba(255,255,255,0.55)" }}>{opt.label}</span>
                  <div className="flex-1"><ProgressBar value={opt.prob || 0} color={colorForOption} height={5} /></div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: colorForOption }}>
                    {Math.round((opt.prob || 0) * 100)}%
                  </span>
                  {market.ai_pick === opt.key && <Check size={12} style={{ color: "#00FF87" }} />}
                </>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}