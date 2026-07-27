"use client";
import { motion } from "framer-motion";
import { Lock, Check, X } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MarketAnalysis } from "@/lib/api/predictions";
import { getConfidenceColor } from "@/lib/confidence-tiers";

export function AnalysisMarketRow({ market, onLockedClick }: { market: MarketAnalysis; onLockedClick: () => void }) {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#111111",
        border: market.is_locked
          ? "1px solid rgba(255,255,255,0.08)"
          : market.ai_was_correct
          ? "1px solid rgba(34,197,94,0.3)"
          : "1px solid rgba(239,68,68,0.25)",
      }}
      whileTap={{ scale: 0.99 }}
      onClick={market.is_locked ? onLockedClick : undefined}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="text-sm font-bold text-white">{market.label}</span>
        {market.is_locked ? (
          <div className="flex items-center gap-1.5">
            <Lock size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--warning)" }}>PRO</span>
          </div>
        ) : market.ai_was_correct ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(34,197,94,0.1)", color: "var(--success)" }}>
            <Check size={10} /> AI Sahihi
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
            <X size={10} /> AI Ilikosea
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        {market.options.map((opt) => {
          const colorForOption = getConfidenceColor((opt.prob || 0) * 100);
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
                  <span
                    className="text-xs w-24 truncate flex items-center gap-1"
                    style={{ color: opt.was_actual_outcome ? "var(--success)" : "rgba(255,255,255,0.55)", fontWeight: opt.was_actual_outcome ? 700 : 400 }}
                  >
                    {opt.was_actual_outcome && "✅"} {opt.label}
                  </span>
                  <div className="flex-1"><ProgressBar value={opt.prob || 0} color={colorForOption} height={5} /></div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: colorForOption }}>
                    {Math.round((opt.prob || 0) * 100)}%
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
