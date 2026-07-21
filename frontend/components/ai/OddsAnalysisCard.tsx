"use client";

import { motion } from "framer-motion";
import { TrendingUp, Shield } from "lucide-react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

interface OddsAnalysisCardProps {
  selection: string;
  currentOdds: number;
  risk: "low" | "medium" | "high";
  confidence: number;
  expectedValue?: number;
}

export function OddsAnalysisCard({ 
  selection, 
  currentOdds, 
  risk, 
  confidence,
  expectedValue 
}: OddsAnalysisCardProps) {
  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return {
          color: "var(--success)",
          background: "rgba(34, 197, 94, 0.1)",
          borderColor: "rgba(34, 197, 94, 0.3)",
          label: "Low Risk",
        };
      case "medium":
        return {
          color: "var(--warning)",
          background: "rgba(245, 158, 11, 0.1)",
          borderColor: "rgba(245, 158, 11, 0.3)",
          label: "Medium Risk",
        };
      case "high":
        return {
          color: "var(--danger)",
          background: "rgba(239, 68, 68, 0.1)",
          borderColor: "rgba(239, 68, 68, 0.3)",
          label: "High Risk",
        };
      default:
        return {
          color: "var(--text-secondary)",
          background: "var(--surface-alt)",
          borderColor: "var(--border)",
          label: "Unknown",
        };
    }
  };

  const riskConfig = getRiskConfig(risk);

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
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(212, 175, 55, 0.1)" }}
        >
          <TrendingUp size={16} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h3 
          className="font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          Odds Analysis
        </h3>
      </div>

      {/* Selection */}
      <div className="mb-4">
        <div 
          className="text-xs mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Selection
        </div>
        <div 
          className="text-lg font-black"
          style={{ color: "var(--brand-primary)" }}
        >
          {selection}
        </div>
      </div>

      {/* Current Odds */}
      <div className="mb-4">
        <div 
          className="text-xs mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Current Odds
        </div>
        <div 
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {currentOdds.toFixed(2)}
        </div>
      </div>

      {/* Risk */}
      <div className="mb-4">
        <div 
          className="text-xs mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Risk Level
        </div>
        <div 
          className="inline-block px-3 py-1.5 rounded-xl text-sm font-bold"
          style={{
            background: riskConfig.background,
            color: riskConfig.color,
            borderColor: riskConfig.borderColor,
            border: "1px solid",
          }}
        >
          {riskConfig.label}
        </div>
      </div>

      {/* Confidence */}
      <ConfidenceIndicator confidence={confidence} size="sm" />

      {/* Expected Value */}
      {expectedValue !== undefined && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} style={{ color: "var(--text-secondary)" }} />
              <span 
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Expected Value
              </span>
            </div>
            <div 
              className="text-sm font-bold"
              style={{ 
                color: expectedValue > 0 ? "var(--success)" : "var(--danger)"
              }}
            >
              {expectedValue > 0 ? "+" : ""}{expectedValue.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
