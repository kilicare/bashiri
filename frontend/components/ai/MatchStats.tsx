"use client";

import { motion } from "framer-motion";

interface StatItem {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  isPercentage?: boolean;
}

interface MatchStatsProps {
  stats: StatItem[];
  homeTeam: string;
  awayTeam: string;
}

export function MatchStats({ stats, homeTeam, awayTeam }: MatchStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-4 border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div 
        className="text-sm font-bold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Match Statistics
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            {/* Label */}
            <div 
              className="text-xs font-medium text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              {stat.label}
            </div>

            {/* Values */}
            <div className="flex items-center justify-between gap-4">
              {/* Home Value */}
              <div 
                className="text-sm font-bold flex-1 text-right"
                style={{ color: "var(--text-primary)" }}
              >
                {stat.homeValue}
                {stat.isPercentage && "%"}
              </div>

              {/* Progress Bar */}
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getPercentage(stat.homeValue, stat.awayValue, stat.isPercentage)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 + 0.2 }}
                  className="h-full"
                  style={{ background: "var(--brand-primary)" }}
                />
              </div>

              {/* Away Value */}
              <div 
                className="text-sm font-bold flex-1 text-left"
                style={{ color: "var(--text-primary)" }}
              >
                {stat.awayValue}
                {stat.isPercentage && "%"}
              </div>
            </div>

            {/* Team Labels */}
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex-1 text-right truncate">{homeTeam}</span>
              <span className="flex-1 text-left truncate">{awayTeam}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function getPercentage(home: string | number, away: string | number, isPercentage?: boolean): number {
  if (isPercentage) {
    const homeNum = typeof home === "string" ? parseInt(home) : home;
    return homeNum || 0;
  }
  
  const homeNum = typeof home === "string" ? parseFloat(home) : home;
  const awayNum = typeof away === "string" ? parseFloat(away) : away;
  const total = homeNum + awayNum;
  
  if (total === 0) return 50;
  return (homeNum / total) * 100;
}
