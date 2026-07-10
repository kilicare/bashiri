"use client";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

export function DidYouKnowCard({ data }: { data: any }) {
  return (
    <motion.div
      className="rounded-3xl p-6"
      style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.02))", border: "1px solid rgba(245,166,35,0.2)" }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} style={{ color: "#F5A623" }} />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#F5A623" }}>Did You Know?</span>
      </div>
      <p className="text-lg font-bold text-white leading-snug mb-3">{data.fact}</p>
      <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
        {data.league}
      </span>
    </motion.div>
  );
}
