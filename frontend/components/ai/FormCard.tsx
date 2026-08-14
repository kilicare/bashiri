"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

type MatchResult = "W" | "D" | "L";

interface FormCardProps {
  teamName: string;
  results: MatchResult[];
}

function ResultBadge({ result }: { result: MatchResult }) {
  const styles = {
    W: {
      background: "rgba(34, 197, 94, 0.2)",
      color: "var(--success)",
      borderColor: "rgba(34, 197, 94, 0.3)",
    },
    D: {
      background: "rgba(245, 158, 11, 0.2)",
      color: "var(--warning)",
      borderColor: "rgba(245, 158, 11, 0.3)",
    },
    L: {
      background: "rgba(239, 68, 68, 0.2)",
      color: "var(--danger)",
      borderColor: "rgba(239, 68, 68, 0.3)",
    },
  };

  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border"
      style={styles[result]}
    >
      {result}
    </div>
  );
}

export function FormCard({ teamName, results }: FormCardProps) {
  const calculateStats = () => {
    const wins = results.filter((r) => r === "W").length;
    const draws = results.filter((r) => r === "D").length;
    const losses = results.filter((r) => r === "L").length;
    const points = wins * 3 + draws * 1;
    
    return { wins, draws, losses, points };
  };

  const stats = calculateStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
      className="rounded-2xl p-4 border w-full overflow-hidden"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} style={{ color: "var(--brand-primary)" }} />
        <h3 
          className="font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          Recent Form
        </h3>
      </div>

      {/* Team Name */}
      <div 
        className="font-bold text-sm mb-3 truncate"
        style={{ color: "var(--text-primary)" }}
        title={teamName}
      >
        {teamName}
      </div>

      {/* Results */}
      <div className="flex gap-2 mb-4">
        {results.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <ResultBadge result={result} />
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div 
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        <div className="flex gap-4">
          <span>{stats.wins}W</span>
          <span>{stats.draws}D</span>
          <span>{stats.losses}L</span>
        </div>
        <div className="font-bold" style={{ color: "var(--brand-primary)" }}>
          {stats.points} pts
        </div>
      </div>
    </motion.div>
  );
}
