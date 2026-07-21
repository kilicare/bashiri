"use client";
import { motion } from "framer-motion";
import { ConfidenceBadge, PremiumBadge } from "@/components/ui/Badge";
import { Brain, TrendingUp, Clock, Sparkles, Info } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { ConfidenceEducation } from "@/components/predictions/ConfidenceEducation";
import { createPortal } from "react-dom";

export function AIPickCard({ data }: { data: any }) {
  const { match, ai_pick, reasons } = data;
  const [showEducation, setShowEducation] = useState(false);
  const selectionLabel: Record<string, string> = {
    "Home Win": match.home_team,
    Draw: "Sare",
    "Away Win": match.away_team,
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
            <button
              onClick={() => setShowEducation(true)}
              className="p-2.5 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
              style={{ background: "rgba(212,175,55,0.1)", color: "var(--brand-primary)", touchAction: "manipulation" }}
              title="Jifunze kuhusu uhakika"
            >
              <Info size={13} />
            </button>
            <PremiumBadge variant={isStrong ? "green" : hasEdge ? "gold" : "red"}>
              {isStrong ? "High" : hasEdge ? "Edge" : "Low"}
            </PremiumBadge>
            <div className="rounded-xl border px-2.5 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{ai_pick.confidence}%</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{selectionLabel[ai_pick.selection]}</p>
          <p className="mt-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>{match.home_team} vs {match.away_team}</p>
        </div>

        <div className="mt-5 flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          <div className="flex items-center gap-1.5">
            <TrendingUp 
              className={clsx("h-3.5 w-3.5", isStrong ? "text-[var(--brand-accent)]" : hasEdge ? "text-[var(--warning)]" : "text-[var(--danger)]")} 
              style={isStrong ? { color: "var(--brand-accent)" } : hasEdge ? { color: "var(--warning)" } : { color: "var(--danger)" }}
            />
            <span>{ai_pick.market}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
            <span>{match.kickoff_at ? new Date(match.kickoff_at).toLocaleString("sw-TZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--brand-accent)" }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--brand-accent)" }} />
            </motion.div>
            <span>Reasoning</span>
          </div>
          <div className="space-y-2">
            {reasons.slice(0, 2).map((reason: string, index: number) => (
              <div key={index} className="rounded-xl border p-2.5 transition-all duration-200 hover:border-[var(--brand-accent)]/20 hover:bg-[var(--surface)]/80" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{reason}</p>
              </div>
            ))}
            {reasons.length > 2 && (
              <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>+{reasons.length - 2} more reasons</p>
            )}
          </div>
        </div>
      </div>
      
      {showEducation && createPortal(
        <ConfidenceEducation onClose={() => setShowEducation(false)} />,
        document.body
      )}
    </motion.article>
  );
}
