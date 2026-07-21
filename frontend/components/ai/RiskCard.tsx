"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Shield, Info } from "lucide-react";

type RiskLevel = "low" | "medium" | "high";

interface RiskCardProps {
  level: RiskLevel;
  reason: string;
  factors?: string[];
}

export function RiskCard({ level, reason, factors }: RiskCardProps) {
  const getRiskConfig = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case "low":
        return {
          color: "var(--success)",
          background: "rgba(34, 197, 94, 0.1)",
          borderColor: "rgba(34, 197, 94, 0.3)",
          icon: Shield,
          label: "Low Risk",
        };
      case "medium":
        return {
          color: "var(--warning)",
          background: "rgba(245, 158, 11, 0.1)",
          borderColor: "rgba(245, 158, 11, 0.3)",
          icon: AlertTriangle,
          label: "Medium Risk",
        };
      case "high":
        return {
          color: "var(--danger)",
          background: "rgba(239, 68, 68, 0.1)",
          borderColor: "rgba(239, 68, 68, 0.3)",
          icon: AlertTriangle,
          label: "High Risk",
        };
    }
  };

  const config = getRiskConfig(level);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
      className="rounded-2xl p-4 border"
      style={{
        background: config.background,
        borderColor: config.borderColor,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} style={{ color: config.color }} />
        <h3 
          className="font-bold text-sm"
          style={{ color: config.color }}
        >
          {config.label}
        </h3>
      </div>

      {/* Reason */}
      <div 
        className="text-sm mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        {reason}
      </div>

      {/* Factors */}
      {factors && factors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Info size={12} style={{ color: "var(--text-secondary)" }} />
            <span 
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Key Factors
            </span>
          </div>
          <ul className="space-y-1">
            {factors.map((factor, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-xs flex items-start gap-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <span style={{ color: config.color }}>•</span>
                {factor}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
