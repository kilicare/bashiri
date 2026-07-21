"use client";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

export function DidYouKnowCard({ data }: { data: any }) {
  return (
    <motion.div
      className="rounded-3xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{ 
        background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))", 
        border: "1px solid rgba(212,175,55,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} style={{ color: "var(--brand-accent)" }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--brand-accent)" }}>Did You Know?</span>
      </div>
      <p className="text-lg font-semibold leading-snug mb-3" style={{ color: "var(--text-primary)" }}>{data.fact}</p>
      <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>
        {data.league}
      </span>
    </motion.div>
  );
}
