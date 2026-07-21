"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type MomentumDirection = "up" | "down" | "neutral";

interface MomentumIndicatorProps {
  team: string;
  direction: MomentumDirection;
  intensity?: number; // 1-10
  timeframe?: string;
}

export function MomentumIndicator({ 
  team, 
  direction, 
  intensity = 5,
  timeframe = "Last 10 minutes"
}: MomentumIndicatorProps) {
  const getIcon = () => {
    switch (direction) {
      case "up":
        return <TrendingUp size={16} />;
      case "down":
        return <TrendingDown size={16} />;
      default:
        return <Minus size={16} />;
    }
  };

  const getColor = () => {
    switch (direction) {
      case "up":
        return "var(--success)";
      case "down":
        return "var(--danger)";
      default:
        return "var(--text-secondary)";
    }
  };

  const getBackground = () => {
    switch (direction) {
      case "up":
        return "rgba(34, 197, 94, 0.1)";
      case "down":
        return "rgba(239, 68, 68, 0.1)";
      default:
        return "rgba(255, 255, 255, 0.05)";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-4 border"
      style={{
        background: getBackground(),
        borderColor: direction === "neutral" ? "var(--border)" : getColor(),
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: getColor(), color: "#fff" }}
          >
            {getIcon()}
          </div>
          <div>
            <div 
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {team}
            </div>
            <div 
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {timeframe}
            </div>
          </div>
        </div>
      </div>

      {/* Intensity Bar */}
      <div className="space-y-2">
        <div 
          className="text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Momentum Intensity
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <motion.div
              key={level}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: level * 0.05 }}
              className="flex-1 h-2 rounded-full"
              style={{
                background: level <= intensity ? getColor() : "var(--surface-alt)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
