"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface AnalysisPoint {
  title: string;
  description: string;
  type?: "positive" | "neutral" | "warning";
}

interface VisionAnalysisCardProps {
  title: string;
  analysis: AnalysisPoint[];
}

export function VisionAnalysisCard({ title, analysis }: VisionAnalysisCardProps) {
  const getTypeColor = (type?: string) => {
    switch (type) {
      case "positive":
        return "var(--success)";
      case "warning":
        return "var(--warning)";
      default:
        return "var(--brand-primary)";
    }
  };

  const getTypeBackground = (type?: string) => {
    switch (type) {
      case "positive":
        return "rgba(34, 197, 94, 0.1)";
      case "warning":
        return "rgba(245, 158, 11, 0.1)";
      default:
        return "rgba(212, 175, 55, 0.1)";
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
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(212, 175, 55, 0.1)" }}
        >
          <Brain size={16} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h3 
          className="font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
      </div>

      {/* Analysis Points */}
      <div className="space-y-3">
        {analysis.map((point, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 rounded-xl"
            style={{ background: getTypeBackground(point.type) }}
          >
            <div 
              className="text-sm font-medium mb-1"
              style={{ color: getTypeColor(point.type) }}
            >
              {point.title}
            </div>
            <div 
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {point.description}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
