"use client";

import { motion } from "framer-motion";
import { TrendingUp, Shield, Swords } from "lucide-react";

interface TeamStats {
  attack: number; // 1-5
  defense: number; // 1-5
  form: number; // 1-5
}

interface TeamComparisonCardProps {
  homeTeam: string;
  awayTeam: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className="text-sm"
          style={{ 
            color: star <= value ? "var(--brand-primary)" : "var(--border)"
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

export function TeamComparisonCard({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats
}: TeamComparisonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      className="rounded-2xl p-4 border w-full overflow-hidden"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Swords size={18} style={{ color: "var(--brand-primary)" }} />
        <h3 
          className="font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          Team Comparison
        </h3>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Home Team */}
        <div className="space-y-3 min-w-0">
          <div 
            className="font-bold text-sm truncate"
            style={{ color: "var(--text-primary)" }}
            title={homeTeam}
          >
            {homeTeam}
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={12} style={{ color: "var(--text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Attack
                </span>
              </div>
              <StarRating value={homeStats.attack} />
            </div>
            
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Shield size={12} style={{ color: "var(--text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Defense
                </span>
              </div>
              <StarRating value={homeStats.defense} />
            </div>
            
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Form
                </span>
              </div>
              <StarRating value={homeStats.form} />
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <span 
            className="font-black text-lg"
            style={{ color: "var(--brand-primary)" }}
          >
            VS
          </span>
        </div>

        {/* Away Team */}
        <div className="space-y-3 min-w-0">
          <div 
            className="font-bold text-sm truncate text-right"
            style={{ color: "var(--text-primary)" }}
            title={awayTeam}
          >
            {awayTeam}
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-1 mb-1 justify-end">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Attack
                </span>
                <TrendingUp size={12} style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="flex justify-end">
                <StarRating value={awayStats.attack} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-1 mb-1 justify-end">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Defense
                </span>
                <Shield size={12} style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="flex justify-end">
                <StarRating value={awayStats.defense} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-1 mb-1 justify-end">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Form
                </span>
              </div>
              <div className="flex justify-end">
                <StarRating value={awayStats.form} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
