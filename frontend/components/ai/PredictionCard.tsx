"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

interface PredictionCardProps {
  prediction: string;
  confidence: number;
  teams?: {
    home: string;
    away: string;
  };
}

export function PredictionCard({ prediction, confidence, teams }: PredictionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-4 border w-full overflow-hidden"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--gradient-gold)" }}
        >
          <Trophy size={16} style={{ color: "#000" }} />
        </div>
        <h3 
          className="font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          Prediction
        </h3>
      </div>

      {/* Prediction Content */}
      <div className="mb-4">
        {teams ? (
          <div className="space-y-2">
            <div 
              className="text-lg font-black truncate"
              style={{ color: "var(--text-primary)" }}
              title={teams.home}
            >
              {teams.home}
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              vs
            </div>
            <div 
              className="text-lg font-black truncate"
              style={{ color: "var(--text-primary)" }}
              title={teams.away}
            >
              {teams.away}
            </div>
            <div 
              className="text-xl font-black mt-3 break-words"
              style={{ color: "var(--brand-primary)" }}
            >
              {prediction}
            </div>
          </div>
        ) : (
          <div 
            className="text-xl font-black break-words"
            style={{ color: "var(--brand-primary)" }}
          >
            {prediction}
          </div>
        )}
      </div>

      {/* Confidence */}
      <ConfidenceIndicator confidence={confidence} size="md" />
    </motion.div>
  );
}
