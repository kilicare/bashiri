"use client";
import { motion } from "framer-motion";
import { Lock, Check, Info } from "lucide-react";
import { PremiumProgressBar } from "./ui/PremiumProgressBar";
import { ConfidenceBadge, getConfidenceMicrocopy } from "./ui/ConfidenceBadge";
import { getMarketIcon } from "./ui/MarketIcons";
import { PremiumCard } from "@/components/ui/GlassCard";
import { Market } from "@/lib/api/predictions";

interface PremiumMarketCardProps {
  market: Market;
  variant?: "primary" | "supporting";
  onLockedClick?: () => void;
}

export function PremiumMarketCard({ market, variant = "primary", onLockedClick }: PremiumMarketCardProps) {
  const icon = getMarketIcon(market.key);
  const aiPickOption = market.options.find(opt => opt.key === market.ai_pick);
  const confidence = market.confidence || (aiPickOption?.prob ? aiPickOption.prob * 100 : 0);
  
  const isPrimary = variant === "primary";
  const cardPadding = isPrimary ? "p-4" : "p-3";
  const titleSize = isPrimary ? "text-sm" : "text-xs";
  const optionTextSize = isPrimary ? "text-xs" : "text-[11px]";
  const barHeight = isPrimary ? 5 : 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: market.is_locked ? 1 : 0.99 }}
      onClick={market.is_locked ? onLockedClick : undefined}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <PremiumCard 
        variant="default" 
        hover={!market.is_locked}
        className={cardPadding}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className={`${titleSize} font-bold text-white`}>{market.label}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {market.is_locked ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                <Lock size={12} className="text-white/40" />
                <span className="text-[10px] font-bold text-amber-400">PRO</span>
              </div>
            ) : market.ai_pick ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Check size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">AI PICK</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {market.options.map((opt, idx) => {
            const isAIPick = market.ai_pick === opt.key;
            const optConfidence = (opt.prob || 0) * 100;
            
            return (
              <div key={opt.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isAIPick && !market.is_locked && (
                      <Check size={12} className="text-amber-400 flex-shrink-0" />
                    )}
                    <span 
                      className={`${optionTextSize} font-medium truncate`}
                      style={{ 
                        color: market.is_locked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)"
                      }}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {!market.is_locked && (
                      <>
                        <span 
                          className={`${optionTextSize} font-bold`}
                          style={{ color: isAIPick ? "#F59E0B" : "rgba(255,255,255,0.5)" }}
                        >
                          {Math.round(optConfidence)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {!market.is_locked ? (
                  <PremiumProgressBar 
                    value={opt.prob || 0} 
                    height={barHeight}
                    showGlow={isAIPick}
                  />
                ) : (
                  <div 
                    className="w-full rounded-full"
                    style={{ 
                      height: barHeight, 
                      background: "rgba(255,255,255,0.06)",
                      filter: "blur(2px)"
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Confidence Badge for Primary Markets */}
        {isPrimary && !market.is_locked && market.confidence && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Info size={12} className="text-white/40" />
                <span className="text-[10px] text-white/50">{getConfidenceMicrocopy(confidence)}</span>
              </div>
              <ConfidenceBadge confidence={confidence} size="sm" />
            </div>
          </div>
        )}
      </PremiumCard>
    </motion.div>
  );
}
