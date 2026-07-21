"use client";

import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";

interface Recommendation {
  title: string;
  description: string;
  action?: string;
  priority?: "high" | "medium" | "low";
}

interface VisionRecommendationCardProps {
  recommendations: Recommendation[];
}

export function VisionRecommendationCard({ recommendations }: VisionRecommendationCardProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "var(--danger)";
      case "medium":
        return "var(--warning)";
      default:
        return "var(--brand-primary)";
    }
  };

  const getPriorityBackground = (priority?: string) => {
    switch (priority) {
      case "high":
        return "rgba(239, 68, 68, 0.1)";
      case "medium":
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
          <Lightbulb size={16} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h3 
          className="font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          Recommendations
        </h3>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 rounded-xl border"
            style={{ 
              background: getPriorityBackground(rec.priority),
              borderColor: getPriorityColor(rec.priority)
            }}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div 
                  className="text-sm font-medium mb-1"
                  style={{ color: getPriorityColor(rec.priority) }}
                >
                  {rec.title}
                </div>
                <div 
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {rec.description}
                </div>
              </div>
              {rec.action && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--glass-bg)" }}
                >
                  <ArrowRight size={14} style={{ color: "var(--brand-primary)" }} />
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
