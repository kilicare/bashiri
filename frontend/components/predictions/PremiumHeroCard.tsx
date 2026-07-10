"use client";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import { PremiumCard } from "@/components/ui/GlassCard";
import { ConfidenceBadge, getConfidenceMicrocopy } from "./ui/ConfidenceBadge";
import { getMarketIcon } from "./ui/MarketIcons";

interface PremiumHeroCardProps {
  market: {
    key: string;
    label: string;
    ai_pick: string | null;
    confidence: number | null;
    options: Array<{ key: string; label: string; prob: number | null }>;
  };
  expectedGoals: { home_xg: number; away_xg: number };
  homeTeam: string;
  awayTeam: string;
}

export function PremiumHeroCard({ 
  market, 
  expectedGoals, 
  homeTeam, 
  awayTeam 
}: PremiumHeroCardProps) {
  const aiPickOption = market.options.find(opt => opt.key === market.ai_pick);
  const confidence = market.confidence || (aiPickOption?.prob ? aiPickOption.prob * 100 : 0);
  const icon = getMarketIcon(market.key);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <PremiumCard 
        variant="gradient" 
        className="relative overflow-hidden"
      >
        {/* Background gradient glow */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at top right, rgba(245,166,35,0.3), transparent 50%)"
          }}
        />
        
        {/* AI Badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Sparkles size={12} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400">AI BEST PICK</span>
          </div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xl sm:text-2xl">{icon}</div>
            <div>
              <h3 className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wider">
                AI Recommendation
              </h3>
              <p className="text-sm sm:text-base font-bold text-white">{market.label}</p>
            </div>
          </div>

          {/* Main Prediction */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                Prediction
              </span>
            </div>
            <p className="text-lg sm:text-xl font-black text-white mb-0.5">
              {aiPickOption?.label || "Analyzing..."}
            </p>
            <p className="text-[10px] sm:text-xs text-white/50">{getConfidenceMicrocopy(confidence)}</p>
          </div>

          {/* Confidence Display */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/70">Confidence</span>
              <ConfidenceBadge confidence={confidence} size="md" />
            </div>
          </div>

          {/* Expected Goals */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-[10px] text-white/50 mb-0.5 truncate px-1">{homeTeam}</p>
                <p className="text-base sm:text-lg font-bold text-white">{expectedGoals.home_xg.toFixed(2)}</p>
              </div>
              <div className="px-2 sm:px-3">
                <p className="text-[10px] text-white/40 font-medium">xG</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[10px] text-white/50 mb-0.5 truncate px-1">{awayTeam}</p>
                <p className="text-base sm:text-lg font-bold text-white">{expectedGoals.away_xg.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}
