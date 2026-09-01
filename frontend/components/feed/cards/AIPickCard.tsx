"use client";
import { motion } from "framer-motion";
import { PremiumBadge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Brain, TrendingUp, Clock, Target, AlertCircle, Check, X, Minus, Star, Sparkles } from "lucide-react";
import { clsx } from "clsx";

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
    // 1X2
    "home_win": match.home_team,
    "draw": "Sare",
    "away_win": match.away_team,
    // BTTS
    "btts_yes": "Ndiyo (BTTS)",
    "btts_no": "Hapana (BTTS)",
    // Full Match Over/Under (1.5, 2.5 only per production contract)
    "over_1_5": "Over 1.5",
    "under_1_5": "Under 1.5",
    "over_2_5": "Over 2.5",
    "under_2_5": "Under 2.5",
    // Home Team Goals Over/Under (0.5, 1.5, 2.5)
    "home_over_0_5": "Home Over 0.5",
    "home_under_0_5": "Home Under 0.5",
    "home_over_1_5": "Home Over 1.5",
    "home_under_1_5": "Home Under 1.5",
    "home_over_2_5": "Home Over 2.5",
    "home_under_2_5": "Home Under 2.5",
    // Away Team Goals Over/Under (0.5, 1.5, 2.5)
    "away_over_0_5": "Away Over 0.5",
    "away_under_0_5": "Away Under 0.5",
    "away_over_1_5": "Away Over 1.5",
    "away_under_1_5": "Away Under 1.5",
    "away_over_2_5": "Away Over 2.5",
    "away_under_2_5": "Away Under 2.5",
    // Double Chance
    "1x": "1X (Home au Draw)",
    "x2": "X2 (Away au Draw)",
    "12": "12 (Home au Away)",
    // Draw No Bet
    "home_dnb": "Home DNB",
    "away_dnb": "Away DNB",
    // Correct Score
    "correct_score": "Correct Score",
  };

  // Status configuration
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

  // Check if pick is settled
  const isSettled = ["WON", "LOST", "PUSH", "VOID"].includes(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard hover texture>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ borderColor: "rgba(212,175,55,0.18)", background: "rgba(212,175,55,0.06)", color: "var(--brand-accent)" }}>
              {isElite ? (
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles size={12} />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Brain size={12} />
                </motion.div>
              )}
              {isElite ? "★ ELITE AI PICK" : "AI PICK"}
            </div>
            <div className="flex items-center gap-2">
              <PremiumBadge variant={isElite ? "green" : isStrong ? "gold" : isMinimum ? "sand" : "red"}>
                {isElite ? "Elite" : isStrong ? "Strong" : isMinimum ? "Standard" : "Low"}
              </PremiumBadge>
              <div className="rounded-xl border px-2.5 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{ai_pick.probability_percent}%</p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ borderColor: statusInfo.color, background: statusInfo.color, color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : status === "PUSH" ? "#FFC107" : "rgba(255,255,255,0.6)" }}>
              <StatusIcon size={10} />
              {statusInfo.label}
            </div>
          </div>

          {/* Teams with Logos and Actual Scores */}
          <div className="mt-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Home Team */}
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
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white truncate">{match.home_team}</span>
                  {isSettled && ai_pick.actual_home_score !== null && (
                    <span className="text-xs font-bold" style={{ color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : "#FFC107" }}>
                      {ai_pick.actual_home_score}
                    </span>
                  )}
                </div>
              </div>

              {/* VS or Score */}
              {isSettled ? (
                <div className="px-3 py-1 rounded-lg bg-white/5 flex-shrink-0 font-bold text-lg" style={{ color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : "#FFC107" }}>
                  {ai_pick.actual_home_score}-{ai_pick.actual_away_score}
                </div>
              ) : (
                <div className="px-2 py-1 rounded-lg bg-white/5 flex-shrink-0">
                  <span className="text-xs font-bold text-white/40">VS</span>
                </div>
              )}

              {/* Away Team */}
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-white truncate text-right">{match.away_team}</span>
                  {isSettled && ai_pick.actual_away_score !== null && (
                    <span className="text-xs font-bold" style={{ color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : "#FFC107" }}>
                      {ai_pick.actual_away_score}
                    </span>
                  )}
                </div>
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

          {/* Market Selection */}
          <div className="mt-4">
            <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{selectionLabel[ai_pick.selection] || ai_pick.selection_label}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{ai_pick.market_label}</p>
          </div>

          {/* Result Info for Settled Picks */}
          {isSettled && (
            <div className="mt-4 rounded-xl p-3 border" style={{ borderColor: statusInfo.color, background: statusInfo.color }}>
              <div className="flex items-center gap-2">
                <StatusIcon size={16} style={{ color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : "#FFC107" }} />
                <span className="text-sm font-bold" style={{ color: status === "WON" ? "#4CAF50" : status === "LOST" ? "#F44336" : "#FFC107" }}>
                  AI RESULT: {status}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                Predicted: {ai_pick.probability_percent}% | Final Score: {ai_pick.actual_home_score}-{ai_pick.actual_away_score}
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <div className="flex items-center gap-1.5">
              <TrendingUp 
                className={clsx("h-3.5 w-3.5", isElite ? "text-[var(--brand-accent)]" : isStrong ? "text-[var(--warning)]" : "text-[var(--danger)]")} 
                style={isElite ? { color: "var(--brand-accent)" } : isStrong ? { color: "var(--warning)" } : { color: "var(--danger)" }}
              />
              <span>{ai_pick.market_label}</span>
            </div>
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
