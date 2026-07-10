"use client";
import { motion } from "framer-motion";
import { ConfidenceBadge, PremiumBadge } from "@/components/ui/Badge";
import { Brain, TrendingUp, Clock, Sparkles } from "lucide-react";
import { clsx } from "clsx";

export function AIPickCard({ data }: { data: any }) {
  const { match, ai_pick, reasons } = data;
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
        "group overflow-hidden rounded-[28px] border border-white/10 bg-[#09090f] shadow-[0_40px_120px_rgba(0,0,0,0.16)] transition-transform duration-300",
        "hover:-translate-y-1 hover:shadow-[0_48px_140px_rgba(0,0,0,0.24)]"
      )}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-[#11121a] via-[#12131f] to-[#181a24] p-5">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#7c3aed]/20 to-transparent opacity-70 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/70">
              <Brain size={14} /> AI PICK
            </div>
            <div className="mt-4 max-w-[14rem]">
              <p className="text-2xl font-black text-white">{selectionLabel[ai_pick.selection]}</p>
              <p className="mt-2 text-sm text-white/40">Prediction for {match.home_team} vs {match.away_team}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <PremiumBadge variant={isStrong ? "green" : hasEdge ? "gold" : "red"}>
              {isStrong ? "High Confidence" : hasEdge ? "Edge" : "Caution"}
            </PremiumBadge>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Confidence</p>
              <p className="text-lg font-black text-white">{ai_pick.confidence}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-white/10 bg-[#0f1018] px-5 py-4">
        <div className="flex items-center justify-between gap-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <TrendingUp className={clsx("h-4 w-4", isStrong ? "text-emerald-400" : hasEdge ? "text-amber-400" : "text-rose-400")} />
            <span>Market: {ai_pick.market}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-white/40" />
            <span>{match.kickoff_at ? new Date(match.kickoff_at).toLocaleString("sw-TZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-white/50">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span>Reasoning</span>
        </div>

        <div className="grid gap-3">
          {reasons.map((reason: string, index: number) => (
            <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-colors duration-200 hover:border-white/15 hover:bg-white/10">
              <p className="text-sm leading-6 text-white/80">{reason}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
