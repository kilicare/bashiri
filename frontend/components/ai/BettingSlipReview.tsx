"use client";

import { motion } from "framer-motion";
import { Receipt, Shield, AlertTriangle } from "lucide-react";

interface SlipPick {
  id: string;
  match: string;
  selection: string;
  risk: "safe" | "risky";
  odds: number;
}

interface BettingSlipReviewProps {
  totalMatches: number;
  safePicks: number;
  riskyPicks: number;
  picks: SlipPick[];
  totalOdds?: number;
}

export function BettingSlipReview({ 
  totalMatches, 
  safePicks, 
  riskyPicks, 
  picks,
  totalOdds 
}: BettingSlipReviewProps) {
  const getRiskIcon = (risk: string) => {
    return risk === "safe" ? <Shield size={14} /> : <AlertTriangle size={14} />;
  };

  const getRiskColor = (risk: string) => {
    return risk === "safe" ? "var(--success)" : "var(--warning)";
  };

  const getRiskBackground = (risk: string) => {
    return risk === "safe" ? "rgba(34, 197, 94, 0.1)" : "rgba(245, 158, 11, 0.1)";
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
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(212, 175, 55, 0.1)" }}
        >
          <Receipt size={16} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h3 
          className="font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          Betting Slip Review
        </h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div 
          className="p-3 rounded-xl text-center"
          style={{ background: "var(--surface-alt)" }}
        >
          <div 
            className="text-2xl font-black"
            style={{ color: "var(--brand-primary)" }}
          >
            {totalMatches}
          </div>
          <div 
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Total Matches
          </div>
        </div>
        
        <div 
          className="p-3 rounded-xl text-center"
          style={{ background: "rgba(34, 197, 94, 0.1)" }}
        >
          <div 
            className="text-2xl font-black"
            style={{ color: "var(--success)" }}
          >
            {safePicks}
          </div>
          <div 
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Safe Picks
          </div>
        </div>
        
        <div 
          className="p-3 rounded-xl text-center"
          style={{ background: "rgba(245, 158, 11, 0.1)" }}
        >
          <div 
            className="text-2xl font-black"
            style={{ color: "var(--warning)" }}
          >
            {riskyPicks}
          </div>
          <div 
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Risky Picks
          </div>
        </div>
      </div>

      {/* Total Odds */}
      {totalOdds && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: "var(--surface-alt)" }}>
          <div 
            className="text-xs mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Combined Odds
          </div>
          <div 
            className="text-xl font-bold"
            style={{ color: "var(--brand-primary)" }}
          >
            {totalOdds.toFixed(2)}
          </div>
        </div>
      )}

      {/* Picks List */}
      <div className="space-y-2">
        {picks.map((pick, index) => (
          <motion.div
            key={pick.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: getRiskBackground(pick.risk) }}
          >
            <div className="flex-1">
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {pick.match}
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {pick.selection}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="text-sm font-bold"
                style={{ color: getRiskColor(pick.risk) }}
              >
                {pick.odds.toFixed(2)}
              </div>
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ 
                  background: getRiskBackground(pick.risk),
                  color: getRiskColor(pick.risk)
                }}
              >
                {getRiskIcon(pick.risk)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
