"use client";

import { motion } from "framer-motion";
import { Shield, Sword, TrendingUp } from "lucide-react";

interface TeamCardProps {
  teamName: string;
  attack: number; // 0-100
  defense: number; // 0-100
  form: number; // 0-100
  leaguePosition?: number;
  recentResults?: ("W" | "D" | "L")[];
}

export function TeamCard({ 
  teamName, 
  attack, 
  defense, 
  form,
  leaguePosition,
  recentResults 
}: TeamCardProps) {
  const getStatColor = (value: number) => {
    if (value >= 80) return "var(--success)";
    if (value >= 60) return "var(--brand-primary)";
    if (value >= 40) return "var(--warning)";
    return "var(--danger)";
  };

  const getStatBackground = (value: number) => {
    const color = getStatColor(value);
    return color.replace(")", ", 0.1)").replace("var(", "rgba(");
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "W":
        return "var(--success)";
      case "D":
        return "var(--warning)";
      case "L":
        return "var(--danger)";
      default:
        return "var(--text-secondary)";
    }
  };

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(212, 175, 55, 0.1)" }}
          >
            <Shield size={18} style={{ color: "var(--brand-primary)" }} />
          </div>
          <div>
            <div 
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {teamName}
            </div>
            {leaguePosition && (
              <div 
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Position #{leaguePosition}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-4">
        {/* Attack */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sword size={14} style={{ color: "var(--text-secondary)" }} />
              <span 
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Attack
              </span>
            </div>
            <span 
              className="text-sm font-bold"
              style={{ color: getStatColor(attack) }}
            >
              {attack}
            </span>
          </div>
          <div 
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: "var(--surface-alt)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${attack}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full"
              style={{ background: getStatColor(attack) }}
            />
          </div>
        </div>

        {/* Defense */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Shield size={14} style={{ color: "var(--text-secondary)" }} />
              <span 
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Defense
              </span>
            </div>
            <span 
              className="text-sm font-bold"
              style={{ color: getStatColor(defense) }}
            >
              {defense}
            </span>
          </div>
          <div 
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: "var(--surface-alt)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${defense}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="h-full"
              style={{ background: getStatColor(defense) }}
            />
          </div>
        </div>

        {/* Form */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} style={{ color: "var(--text-secondary)" }} />
              <span 
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Form
              </span>
            </div>
            <span 
              className="text-sm font-bold"
              style={{ color: getStatColor(form) }}
            >
              {form}
            </span>
          </div>
          <div 
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: "var(--surface-alt)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${form}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="h-full"
              style={{ background: getStatColor(form) }}
            />
          </div>
        </div>
      </div>

      {/* Recent Results */}
      {recentResults && recentResults.length > 0 && (
        <div>
          <div 
            className="text-xs mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Recent Results
          </div>
          <div className="flex gap-2">
            {recentResults.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border"
                style={{
                  background: "var(--surface-alt)",
                  borderColor: getResultColor(result),
                  color: getResultColor(result),
                }}
              >
                {result}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
