"use client";
import { motion } from "framer-motion";
import { ConfidenceBadge, PremiumBadge } from "@/components/ui/Badge";
import { Brain, TrendingUp, Clock } from "lucide-react";
import { clsx } from "clsx";

export function AIPickCard({ data }: { data: any }) {
  const { match, ai_pick, reasons } = data;
  const selectionLabel: Record<string, string> = {
    "Home Win": match.home_team, Draw: "Sare", "Away Win": match.away_team,
  };

  const confidenceColor = ai_pick.confidence >= 70 ? "from-green-500/20 to-green-600/10 border-green-500/30" : 
                          ai_pick.confidence >= 50 ? "from-[#F5A623]/20 to-[#E8892A]/10 border-[#F5A623]/30" : 
                          "from-red-500/20 to-red-600/10 border-red-500/30";

  return (
    <motion.div
      className={clsx(
        "rounded-3xl p-5 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
        "bg-gradient-to-br from-[#1A1A24] to-[#22222E] border-white/10"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
            <Brain size={16} className="text-purple-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">
            AI Pick
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">{match.league}</span>
          {match.live && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-400">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Match Teams */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex-1">
          <p className="text-base font-bold text-white mb-1">{match.home_team}</p>
          <p className="text-xs text-white/40">Home</p>
        </div>
        <div className="px-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <span className="text-sm font-bold text-white/60">VS</span>
          </div>
        </div>
        <div className="flex-1 text-right">
          <p className="text-base font-bold text-white mb-1">{match.away_team}</p>
          <p className="text-xs text-white/40">Away</p>
        </div>
      </div>

      {/* AI Prediction Box */}
      <div 
        className={clsx(
          "rounded-2xl p-4 border mb-4 transition-all duration-300",
          "bg-gradient-to-br", confidenceColor
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className={ai_pick.confidence >= 70 ? "text-green-400" : ai_pick.confidence >= 50 ? "text-[#F5A623]" : "text-red-400"} />
            <span className="text-sm font-bold text-white">Prediction</span>
          </div>
          <ConfidenceBadge confidence={ai_pick.confidence} />
        </div>
        <p className="text-lg font-black text-white mb-1">
          {selectionLabel[ai_pick.selection]}
        </p>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock size={12} />
          <span>{match.time}</span>
        </div>
      </div>

      {/* Reasons */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Why This Pick?</p>
        {reasons.map((r: string, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623] mt-1.5 flex-shrink-0" />
            <p className="text-sm text-white/70 leading-relaxed">{r}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}