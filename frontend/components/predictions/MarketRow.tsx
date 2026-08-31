"use client";
import { motion } from "framer-motion";
import { Lock, Check, Bookmark, TrendingUp, Target } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Market } from "@/lib/api/predictions";
import { getConfidenceColor } from "@/lib/confidence-tiers";
import { useState } from "react";
import { shouldReduceMotion } from "@/utils/animation";

interface MarketRowProps {
  market: Market;
  onLockedClick: () => void;
  matchId?: number;
  isSaved?: boolean;
  onSave?: (marketKey: string) => void;
  onUnsave?: (marketKey: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (marketKey: string) => void;
}

export function MarketRow({ market, onLockedClick, matchId, isSaved = false, onSave, onUnsave, selectionMode = false, isSelected = false, onToggleSelection }: MarketRowProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!matchId || !onSave || !onUnsave) return;
    
    setIsSaving(true);
    try {
      if (isSaved) {
        await onUnsave(market.key);
      } else {
        await onSave(market.key);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Get market category for subtle styling
  const isHomeMarket = market.key.startsWith("HOME_GOALS");
  const isAwayMarket = market.key.startsWith("AWAY_GOALS");
  const isFullMatch = !isHomeMarket && !isAwayMarket;
  
  // Get category color for subtle accent
  const categoryColor = isHomeMarket ? "rgba(0,255,135,0.08)" : isAwayMarket ? "rgba(255,100,100,0.08)" : "rgba(212,175,55,0.08)";
  const categoryBorder = isHomeMarket ? "rgba(0,255,135,0.15)" : isAwayMarket ? "rgba(255,100,100,0.15)" : "rgba(212,175,55,0.15)";

  // High confidence indicator
  const hasHighConfidence = market.confidence && market.confidence >= 70;
  const glowColor = hasHighConfidence ? (isHomeMarket ? "rgba(0,255,135,0.1)" : isAwayMarket ? "rgba(255,100,100,0.1)" : "rgba(212,175,55,0.1)") : "transparent";

  return (
    <motion.div
      className="rounded-2xl overflow-hidden relative"
      style={{ 
        background: `linear-gradient(135deg, ${categoryColor} 0%, #111111 100%)`,
        border: `1px solid ${categoryBorder}`
      }}
      whileTap={{ scale: 0.99 }}
      whileHover={{ scale: 1.02, boxShadow: hasHighConfidence ? `0 0 20px ${glowColor}` : "0 4px 12px rgba(0,0,0,0.3)" }}
      onClick={market.is_locked ? onLockedClick : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          {hasHighConfidence && !market.is_locked && (
            <Target size={14} style={{ color: isHomeMarket ? "#00FF87" : isAwayMarket ? "#FF6464" : "#D4AF37" }} />
          )}
          <span className="text-sm font-bold text-white">{market.label}</span>
        </div>
        {selectionMode ? (
          <div className="flex items-center gap-2">
            {matchId && !market.is_locked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection?.(market.key);
                }}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                style={{ 
                  background: isSelected ? "#D4AF37" : "rgba(255,255,255,0.1)",
                  border: isSelected ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.2)"
                }}
              >
                {isSelected ? (
                  <Bookmark size={14} fill="#000" color="#000" />
                ) : (
                  <Bookmark size={14} color="rgba(255,255,255,0.5)" />
                )}
              </button>
            )}
          </div>
        ) : market.is_locked ? (
          <div className="flex items-center gap-1.5">
            <Lock size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span className="text-xs font-bold" style={{ color: "#FFD600" }}>PRO</span>
          </div>
        ) : market.ai_pick ? (
          <div className="flex items-center gap-2">
            <motion.div 
              className="flex items-center gap-1"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <TrendingUp size={12} style={{ color: "#00FF87" }} />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,135,0.15)", color: "#00FF87" }}>
                AI Pick
              </span>
            </motion.div>
            {matchId && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ 
                  background: isSaved ? "rgba(0,255,135,0.2)" : "rgba(255,255,255,0.1)",
                  border: isSaved ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.2)"
                }}
              >
                {isSaving ? (
                  <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Bookmark 
                    size={12} 
                    fill={isSaved ? "#00FF87" : "none"} 
                    style={{ color: isSaved ? "#00FF87" : "rgba(255,255,255,0.5)" }} 
                  />
                )}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="p-4 space-y-2">
        {market.options.map((opt, index) => {
          // MUHIMU: rangi sasa inategemea ASILIMIA HALISI ya option hii
          // (tier-based), SI nafasi yake kwenye orodha — hivyo "chini"
          // itaonekana nyekundu KILA WAKATI, "juu" kijani, bila kujali
          // ni Home/Draw/Away au chaguo lipi.
          const colorForOption = market.is_locked ? "rgba(255,255,255,0.2)" : getConfidenceColor((opt.prob || 0) * 100);
          // Show rank for CORRECT_SCORE market
          const showRank = market.key === "CORRECT_SCORE" && opt.extra?.rank;
          const isAIPick = market.ai_pick === opt.key;
          const prob = opt.prob || 0;
          
          return (
            <motion.div 
              key={opt.key} 
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all"
              style={{ 
                background: isAIPick ? `${colorForOption}15` : "transparent",
                border: isAIPick ? `1px solid ${colorForOption}30` : "none"
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
                  <span className="text-xs w-20 truncate font-medium" style={{ 
                    color: isAIPick ? colorForOption : "rgba(255,255,255,0.7)",
                    fontWeight: isAIPick ? 600 : 400
                  }}>
                    {opt.label}
                  </span>
                  <div className="flex-1">
                    <ProgressBar 
                      value={prob} 
                      color={colorForOption} 
                      height={5}
                      isHighConfidence={prob >= 0.8 && isAIPick}
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
                  {isAIPick && (
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