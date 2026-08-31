"use client";
import { motion } from "framer-motion";
import { Lock, Check, X, Target, TrendingUp, TrendingDown } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MarketAnalysis } from "@/lib/api/predictions";
import { getConfidenceColor } from "@/lib/confidence-tiers";

export function AnalysisMarketRow({ market, onLockedClick }: { market: MarketAnalysis; onLockedClick: () => void }) {
  // Get market category for subtle styling
  const isHomeMarket = market.key.startsWith("HOME_GOALS");
  const isAwayMarket = market.key.startsWith("AWAY_GOALS");
  const isFullMatch = !isHomeMarket && !isAwayMarket;
  
  // Get category color for subtle accent
  const categoryColor = isHomeMarket ? "rgba(0,255,135,0.08)" : isAwayMarket ? "rgba(255,100,100,0.08)" : "rgba(212,175,55,0.08)";
  const categoryBorder = isHomeMarket ? "rgba(0,255,135,0.15)" : isAwayMarket ? "rgba(255,100,100,0.15)" : "rgba(212,175,55,0.15)";
  
  // Result-based styling
  const resultColor = market.ai_was_correct ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)";
  const resultBorder = market.ai_was_correct ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)";
  const resultGlow = market.ai_was_correct ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)";

  return (
    <motion.div
      className="rounded-2xl overflow-hidden relative"
      style={{ 
        background: market.is_locked 
          ? `linear-gradient(135deg, ${categoryColor} 0%, #111111 100%)`
          : `linear-gradient(135deg, ${resultColor} 0%, ${categoryColor} 50%, #111111 100%)`,
        border: market.is_locked
          ? `1px solid ${categoryBorder}`
          : resultBorder
      }}
      whileTap={{ scale: 0.99 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: !market.is_locked ? `0 0 20px ${resultGlow}` : "0 4px 12px rgba(0,0,0,0.3)" 
      }}
      onClick={market.is_locked ? onLockedClick : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          {!market.is_locked && (
            <Target size={14} style={{ color: market.ai_was_correct ? "#22C55E" : "#EF4444" }} />
          )}
          <span className="text-sm font-bold text-white">{market.label}</span>
        </div>
        {market.is_locked ? (
          <div className="flex items-center gap-1.5">
            <Lock size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--warning)" }}>PRO</span>
          </div>
        ) : market.ai_was_correct ? (
          <motion.div 
            className="flex items-center gap-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <TrendingUp size={12} style={{ color: "#22C55E" }} />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
              AI Sahihi
            </span>
          </motion.div>
        ) : (
          <motion.div 
            className="flex items-center gap-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <TrendingDown size={12} style={{ color: "#EF4444" }} />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
              AI Ilikosea
            </span>
          </motion.div>
        )}
      </div>

      <div className="p-4 space-y-2">
        {market.options.map((opt, index) => {
          const colorForOption = getConfidenceColor((opt.prob || 0) * 100);
          // Show rank for CORRECT_SCORE market
          const showRank = market.key === "CORRECT_SCORE" && opt.extra?.rank;
          const isActualOutcome = opt.was_actual_outcome;
          const prob = opt.prob || 0;
          
          return (
            <motion.div 
              key={opt.key} 
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all"
              style={{ 
                background: isActualOutcome ? `${colorForOption}20` : "transparent",
                border: isActualOutcome ? `1px solid ${colorForOption}40` : "none"
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              {market.is_locked ? (
                <>
                  <span className="text-xs w-24 truncate" style={{ color: "rgba(255,255,255,0.3)", filter: "blur(3px)" }}>{opt.label}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", filter: "blur(2px)" }} />
                  <span className="text-xs font-bold w-10 text-right" style={{ color: "rgba(255,255,255,0.2)", filter: "blur(3px)" }}>??%</span>
                </>
              ) : (
                <>
                  {showRank && opt.extra && (
                    <motion.span 
                      className="text-xs font-bold w-6 text-center" 
                      style={{ color: "#D4AF37" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                    >
                      #{opt.extra.rank}
                    </motion.span>
                  )}
                  <span
                    className="text-xs w-20 truncate font-medium flex items-center gap-1"
                    style={{ 
                      color: isActualOutcome ? colorForOption : "rgba(255,255,255,0.7)",
                      fontWeight: isActualOutcome ? 600 : 400
                    }}
                  >
                    {isActualOutcome && <Check size={10} style={{ color: colorForOption }} />} {opt.label}
                  </span>
                  <div className="flex-1">
                    <ProgressBar 
                      value={prob} 
                      color={colorForOption} 
                      height={5}
                      isHighConfidence={isActualOutcome || false}
                    />
                  </div>
                  <motion.span 
                    className="text-xs font-bold w-10 text-right" 
                    style={{ color: colorForOption }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.15 }}
                  >
                    {Math.round(prob * 100)}%
                  </motion.span>
                  {isActualOutcome && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                    >
                      <Check size={12} style={{ color: colorForOption }} />
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
