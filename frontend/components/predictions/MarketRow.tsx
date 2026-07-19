"use client";
import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Market } from "@/lib/api/predictions";
import { PremiumCard } from "@/components/ui/GlassCard";

const COLORS = ["var(--brand-accent)", "var(--warning)", "var(--danger)"];

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
        className="overflow-hidden p-4"
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <span className="text-sm font-bold text-white truncate">{market.label}</span>
          {market.is_locked ? (
            <div className="flex items-center gap-1.5">
              <Lock size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--warning)" }}>PRO</span>
            </div>
          ) : market.ai_pick ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(207,175,123,0.1)", color: "var(--brand-accent)" }}>
              AI Pick ✓
            </span>
          ) : null}
        </div>

        <div className="space-y-3 mt-4">
          {market.options.map((opt, idx) => (
            <div key={opt.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold truncate" style={{ color: market.is_locked ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.75)" }}>
                  {opt.label}
                </span>
                <div className="flex items-center gap-2">
                  {!market.is_locked && market.ai_pick === opt.key && (
                    <Check size={12} style={{ color: "var(--brand-accent)" }} />
                  )}
                  <span className="text-xs font-bold" style={{ color: market.is_locked ? "rgba(255,255,255,0.3)" : COLORS[idx % COLORS.length] }}>
                    {market.is_locked ? "--%" : `${Math.round((opt.prob || 0) * 100)}%`}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                {!market.is_locked ? (
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round((opt.prob || 0) * 100)}%`, background: COLORS[idx % COLORS.length] }}
                  />
                ) : (
                  <div className="h-full rounded-full bg-white/10" />
                )}
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>
    </motion.div>
  );
}