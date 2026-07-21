"use client";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function LiveMatchCard({ data }: { data: any }) {
  const { match } = data;
  return (
    <motion.div
      className="rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{ 
        background: "linear-gradient(180deg, rgba(34,197,94,0.06), var(--surface) 80%)", 
        border: "1px solid rgba(34,197,94,0.2)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(34,197,94,0.1)"
      }}
      animate={{ boxShadow: ["0 4px 24px rgba(0,0,0,0.12)", "0 4px 28px rgba(34,197,94,0.15)", "0 4px 24px rgba(0,0,0,0.12)"] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(34,197,94,0.08)" }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <Activity size={12} style={{ color: "var(--success)" }} />
        </motion.div>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--success)" }}>Live</span>
        <span className="text-xs ml-auto" style={{ color: "var(--text-secondary)" }}>{match.league}</span>
      </div>
      <div className="p-5 flex items-center justify-between">
        <p className="flex-1 text-center font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{match.home_team}</p>
        <div className="mx-4 px-5 py-2 rounded-2xl" style={{ background: "rgba(34,197,94,0.1)" }}>
          <p className="text-3xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{match.score.home} — {match.score.away}</p>
        </div>
        <p className="flex-1 text-center font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{match.away_team}</p>
      </div>
    </motion.div>
  );
}