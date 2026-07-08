"use client";
import { motion } from "framer-motion";

export function LiveMatchCard({ data }: { data: any }) {
  const { match } = data;
  return (
    <motion.div
      className="rounded-3xl overflow-hidden"
      style={{ background: "#111111", border: "1px solid rgba(0,255,135,0.3)" }}
      animate={{ boxShadow: ["0 0 10px rgba(0,255,135,0.1)", "0 0 25px rgba(0,255,135,0.2)", "0 0 10px rgba(0,255,135,0.1)"] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(0,255,135,0.05)" }}>
        <span className="live-dot" />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#00FF87" }}>Live</span>
        <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.4)" }}>{match.league}</span>
      </div>
      <div className="p-5 flex items-center justify-between">
        <p className="flex-1 text-center font-black text-white text-sm">{match.home_team}</p>
        <div className="mx-4 px-5 py-2 rounded-2xl" style={{ background: "rgba(0,255,135,0.08)" }}>
          <p className="text-3xl font-black text-white font-mono">{match.score.home} — {match.score.away}</p>
        </div>
        <p className="flex-1 text-center font-black text-white text-sm">{match.away_team}</p>
      </div>
    </motion.div>
  );
}