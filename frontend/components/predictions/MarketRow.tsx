"use client";
import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Market } from "@/lib/api/predictions";
import { PremiumCard } from "@/components/ui/GlassCard";

const COLORS = ["#F5A623", "#FFD600", "#FF4757"];

export function MarketRow({ market, onLockedClick }: { market: Market; onLockedClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.99 }}
      onClick={market.is_locked ? onLockedClick : undefined}
    >
      <PremiumCard 
        hover 
        className="overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="text-sm font-bold text-white">{market.label}</span>
          {market.is_locked ? (
            <div className="flex items-center gap-1.5">
              <Lock size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
              <span className="text-xs font-bold" style={{ color: "#FFD600" }}>PRO</span>
            </div>
          ) : market.ai_pick ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>
              AI Pick ✓
            </span>
          ) : null}
        </div>

        <div className="p-4 space-y-2">
          {market.options.map((opt, idx) => (
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
                  <div className="flex-1"><ProgressBar value={opt.prob || 0} color={COLORS[idx % COLORS.length]} height={5} /></div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: COLORS[idx % COLORS.length] }}>
                    {Math.round((opt.prob || 0) * 100)}%
                  </span>
                  {market.ai_pick === opt.key && <Check size={12} style={{ color: "#F5A623" }} />}
                </>
              )}
            </div>
          ))}
        </div>
      </PremiumCard>
    </motion.div>
  );
}