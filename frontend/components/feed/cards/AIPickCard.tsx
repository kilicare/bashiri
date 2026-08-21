"use client";
import { motion } from "framer-motion";
import { PremiumBadge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Brain, TrendingUp, Clock, Target } from "lucide-react";
import { clsx } from "clsx";

export function AIPickCard({ data }: { data: any }) {
  const { match, ai_pick } = data;
  const selectionLabel: Record<string, string> = {
    "home_win": match.home_team,
    "draw": "Sare",
    "away_win": match.away_team,
    "over_2.5": "Over 2.5",
    "under_2.5": "Under 2.5",
    "yes": "Ndiyo (BTTS)",
    "no": "Hapana (BTTS)",
  };

  const isStrong = ai_pick.confidence >= 70;
  const hasEdge = ai_pick.confidence >= 55;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard hover texture>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ borderColor: "rgba(212,175,55,0.18)", background: "rgba(212,175,55,0.06)", color: "var(--brand-accent)" }}>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Brain size={12} />
              </motion.div>
              AI PICK
            </div>
            <div className="flex items-center gap-2">
              <PremiumBadge variant={isStrong ? "green" : hasEdge ? "gold" : "red"}>
                {isStrong ? "High" : hasEdge ? "Edge" : "Low"}
              </PremiumBadge>
              <div className="rounded-xl border px-2.5 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{ai_pick.confidence}%</p>
              </div>
            </div>
          </div>

          {/* Teams with Logos */}
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
                <span className="text-sm font-bold text-white truncate">{match.home_team}</span>
              </div>

              {/* VS */}
              <div className="px-2 py-1 rounded-lg bg-white/5 flex-shrink-0">
                <span className="text-xs font-bold text-white/40">VS</span>
              </div>

              {/* Away Team */}
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
            <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{selectionLabel[ai_pick.option_key]}</p>
          </div>

          <div className="mt-5 flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <div className="flex items-center gap-1.5">
              <TrendingUp 
                className={clsx("h-3.5 w-3.5", isStrong ? "text-[var(--brand-accent)]" : hasEdge ? "text-[var(--warning)]" : "text-[var(--danger)]")} 
                style={isStrong ? { color: "var(--brand-accent)" } : hasEdge ? { color: "var(--warning)" } : { color: "var(--danger)" }}
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
