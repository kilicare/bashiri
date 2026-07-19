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
        "group rounded-3xl border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.16)] transition-transform duration-300",
        "hover:-translate-y-1 hover:shadow-[0_48px_140px_rgba(0,0,0,0.24)]"
      )}
      style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(207,175,123,0.12) 40%, rgba(14,14,23,0.98) 100%)", border: "1px solid rgba(212,175,55,0.22)" }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.26em] text-white/60">
            <Brain size={12} /> AI PICK
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEducation(true)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(212,175,55,0.2)", color: "var(--brand-primary)" }}
              title="Jifunze kuhusu uhakika"
            >
              <Info size={12} />
            </button>
            <PremiumBadge variant={isStrong ? "green" : hasEdge ? "gold" : "red"}>
              {isStrong ? "High" : hasEdge ? "Edge" : "Low"}
            </PremiumBadge>
            <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-1">
              <p className="text-xs font-bold text-white">{ai_pick.confidence}%</p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xl font-semibold text-white">{selectionLabel[ai_pick.selection]}</p>
          <p className="mt-1 text-xs text-white/40">{match.home_team} vs {match.away_team}</p>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <TrendingUp 
              className={clsx("h-3 w-3", isStrong ? "text-[var(--brand-accent)]" : hasEdge ? "text-[var(--warning)]" : "text-[var(--danger)]")} 
              style={isStrong ? { color: "var(--brand-accent)" } : hasEdge ? { color: "var(--warning)" } : { color: "var(--danger)" }}
            />
            <span>{ai_pick.market}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-white/40" />
            <span>{match.kickoff_at ? new Date(match.kickoff_at).toLocaleString("sw-TZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-2 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/60">
            <Sparkles className="h-3 w-3" style={{ color: "var(--brand-accent)" }} />
            <span>Reasoning</span>
          </div>
          <div className="space-y-2">
            {reasons.slice(0, 2).map((reason: string, index: number) => (
              <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-2 transition-colors duration-200 hover:border-white/15 hover:bg-white/10">
                <p className="text-xs leading-5 text-white/70">{reason}</p>
              </div>
            ))}
            {reasons.length > 2 && (
              <p className="text-[10px] text-white/40">+{reasons.length - 2} more reasons</p>
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
