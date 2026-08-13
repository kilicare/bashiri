"use client";
import { motion } from "framer-motion";
import { PremiumBadge } from "@/components/ui/Badge";
import { Brain, TrendingUp, Clock } from "lucide-react";
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
    <motion.article
      className={clsx(
        "group rounded-3xl transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg"
      )}
      style={{ 
        background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04) 40%, var(--surface) 100%)", 
        border: "1px solid rgba(212,175,55,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
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

        <div className="mt-5">
          <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{selectionLabel[ai_pick.option_key]}</p>
          <p className="mt-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>{match.home_team} vs {match.away_team}</p>
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
    </motion.article>
  );
}
