"use client";
import { motion } from "framer-motion";

export function LiveMatchCard({ data }: { data: any }) {
  const { match } = data;
  return (
    <motion.div
      className="rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(180deg, rgba(34,197,94,0.12), #111111 80%)", border: "1px solid rgba(34,197,94,0.35)" }}
      animate={{ boxShadow: ["0 0 10px rgba(34,197,94,0.12)", "0 0 28px rgba(34,197,94,0.24)", "0 0 10px rgba(34,197,94,0.12)"] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(34,197,94,0.14)" }}>
        <span className="live-dot" />
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--success)" }}>Live</span>
        <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.4)" }}>{match.league}</span>
      </div>
      <div className="p-5 flex items-center justify-between">
        <p className="flex-1 text-center font-semibold text-white text-sm">{match.home_team}</p>
        <div className="mx-4 px-5 py-2 rounded-2xl" style={{ background: "rgba(34,197,94,0.18)" }}>
          <p className="text-3xl font-bold text-white font-mono">{match.score.home} — {match.score.away}</p>
        </div>
        <p className="flex-1 text-center font-semibold text-white text-sm">{match.away_team}</p>
      </div>
    </motion.div>
  );
}