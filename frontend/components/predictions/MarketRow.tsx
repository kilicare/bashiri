"use client";
import { motion } from "framer-motion";
import { Lock, Check, Bookmark } from "lucide-react";
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

  return (
    <motion.div
      className="rounded-2xl overflow-hidden relative"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
      whileTap={{ scale: 0.99 }}
      onClick={market.is_locked ? onLockedClick : undefined}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="text-sm font-bold text-white">{market.label}</span>
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,135,0.1)", color: "#00FF87" }}>
              AI Pick ✓
            </span>
            {matchId && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
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
        {market.options.map((opt) => {
          // MUHIMU: rangi sasa inategemea ASILIMIA HALISI ya option hii
          // (tier-based), SI nafasi yake kwenye orodha — hivyo "chini"
          // itaonekana nyekundu KILA WAKATI, "juu" kijani, bila kujali
          // ni Home/Draw/Away au chaguo lipi.
          const colorForOption = market.is_locked ? "rgba(255,255,255,0.2)" : getConfidenceColor((opt.prob || 0) * 100);
          // Show rank for CORRECT_SCORE market
          const showRank = market.key === "CORRECT_SCORE" && opt.extra?.rank;
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
                  {showRank && opt.extra && (
                    <span className="text-xs font-bold w-6 text-center" style={{ color: "#D4AF37" }}>
                      #{opt.extra.rank}
                    </span>
                  )}
                  <span className="text-xs w-20 truncate" style={{ color: "rgba(255,255,255,0.55)" }}>{opt.label}</span>
                  <div className="flex-1">
                    <ProgressBar 
                      value={opt.prob || 0} 
                      color={colorForOption} 
                      height={5}
                      isHighConfidence={(opt.prob || 0) >= 0.8 && market.ai_pick === opt.key}
                    />
                  </div>
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