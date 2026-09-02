"use client";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Brain, Sparkles, Target, AlertCircle, Check, X, Minus, Clock } from "lucide-react";

export function AIPickCard({ data }: { data: any }) {
  const { match, ai_pick } = data;

  // Handle case where ai_pick might be null (NO_STRONG_PICK)
  if (!ai_pick) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard hover texture>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ borderColor: "rgba(255,100,100,0.18)", background: "rgba(255,100,100,0.06)", color: "#ff6464" }}>
                <AlertCircle size={12} />
                NO PICK
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/5 flex-shrink-0">
                    {match.home_team_crest_url ? (
                      <img
                        src={match.home_team_crest_url}
                        alt={match.home_team}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <Target size={16} className="text-[#D4AF37]" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-white truncate">{match.home_team}</span>
                </div>

                <div className="px-2 py-1 rounded-lg bg-white/5 flex-shrink-0">
                  <span className="text-xs font-bold text-white/40">VS</span>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-sm font-bold text-white truncate text-right">{match.away_team}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/5 flex-shrink-0">
                    {match.away_team_crest_url ? (
                      <img
                        src={match.away_team_crest_url}
                        alt={match.away_team}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <Target size={16} className="text-[#D4AF37]" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-white">Hakuna soko lenye uhakika wa kutosha kwa mechi hii.</p>
            </div>

            <div className="mt-5 flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
                <span>{match.kickoff_at ? new Date(match.kickoff_at).toLocaleString("sw-TZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  const selectionLabel: Record<string, string> = {
    "Home": match.home_team,
    "Draw": "Sare",
    "Away": match.away_team,
    "Yes": "Ndiyo (BTTS)",
    "No": "Hapana (BTTS)",
    "1X": "1X (Home au Draw)",
    "X2": "X2 (Away au Draw)",
    "12": "12 (Home au Away)",
    "Over": "Over",
    "Under": "Under",
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    "PENDING": { label: "PENDING", color: "rgba(255, 255, 255, 0.1)", icon: Clock },
    "LIVE": { label: "LIVE", color: "rgba(239, 68, 68, 0.2)", icon: Target },
    "WON": { label: "WON", color: "rgba(76, 175, 80, 0.2)", icon: Check },
    "LOST": { label: "LOST", color: "rgba(239, 68, 68, 0.2)", icon: X },
    "PUSH": { label: "PUSH", color: "rgba(255, 193, 7, 0.2)", icon: Minus },
    "VOID": { label: "VOID", color: "rgba(156, 163, 175, 0.2)", icon: Minus },
    "CANCELLED": { label: "CANCELLED", color: "rgba(156, 163, 175, 0.2)", icon: X },
  };

  const status = ai_pick.status || "PENDING";
  const statusInfo = statusConfig[status] || statusConfig["PENDING"];
  const StatusIcon = statusInfo.icon;

  const isElite = ai_pick.tier === "ELITE";
  const isStrong = ai_pick.tier === "STRONG";
  const isMinimum = ai_pick.tier === "MINIMUM";

  const isSettled = ["WON", "LOST", "PUSH", "VOID"].includes(status);

  const tierLabel = isElite ? "Elite" : isStrong ? "Strong" : isMinimum ? "Std" : "Low";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard hover texture>
        <div className="p-5">
          {/* Top Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-medium uppercase tracking-wider" style={{ borderColor: "rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.05)", color: "var(--brand-accent)" }}>
                {isElite ? (
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles size={8} />
                  </motion.div>
                ) : (
                  <Brain size={8} />
                )}
                AI PICK
              </div>
              <span className="text-[10px] font-medium" style={{ color: "rgba(212,175,55,0.7)" }}>
                {tierLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {ai_pick.probability_percent}%
              </span>
              {isSettled && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ background: status === "WON" ? "rgba(76, 175, 80, 0.15)" : status === "LOST" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 193, 7, 0.15)" }}>
                  <StatusIcon size={12} style={{ color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : "#FFC107" }} />
                  <span className="text-[10px] font-bold" style={{ color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : "#FFC107" }}>
                    {status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Match Result Section */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/5 flex-shrink-0">
                {match.home_team_crest_url ? (
                  <img
                    src={match.home_team_crest_url}
                    alt={match.home_team}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <Target size={18} className="text-[#D4AF37]" />
                )}
              </div>
              <span className="text-sm font-bold text-white truncate">{match.home_team}</span>
            </div>

            <div className="text-center">
              {isSettled ? (
                <div className="text-xl font-bold" style={{ color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : "#FFC107" }}>
                  {ai_pick.actual_home_score}-{ai_pick.actual_away_score}
                </div>
              ) : (
                <span className="text-xs font-bold text-white/40">VS</span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-bold text-white truncate text-right">{match.away_team}</span>
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/5 flex-shrink-0">
                {match.away_team_crest_url ? (
                  <img
                    src={match.away_team_crest_url}
                    alt={match.away_team}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <Target size={18} className="text-[#D4AF37]" />
                )}
              </div>
            </div>
          </div>

          {/* Prediction Section - Main Focal Point */}
          <div className="mb-4">
            <p className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              {ai_pick.selection_label || selectionLabel[ai_pick.selection] || ai_pick.selection}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {ai_pick.market_label}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <Clock size={12} style={{ opacity: 0.6 }} />
            <span>
              {match.kickoff_at ? new Date(match.kickoff_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
