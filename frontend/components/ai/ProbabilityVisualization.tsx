"use client";

import { motion } from "framer-motion";

interface ProbabilityItem {
  label: string;
  value: number; // percentage
  color?: string;
}

interface ProbabilityVisualizationProps {
  probabilities: ProbabilityItem[];
  title?: string;
}

export function ProbabilityVisualization({ 
  probabilities, 
  title = "Match Probability" 
}: ProbabilityVisualizationProps) {
  const getDefaultColor = (index: number) => {
    const colors = [
      "var(--brand-primary)",
      "var(--brand-accent)",
      "var(--info)",
    ];
    return colors[index % colors.length];
  };

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
      <div 
        className="text-sm font-bold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </div>

      {/* Probability Bars */}
      <div className="space-y-4">
        {probabilities.map((prob, index) => (
          <motion.div
            key={prob.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            {/* Label Row */}
            <div className="flex items-center justify-between">
              <div 
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {prob.label}
              </div>
              <div 
                className="text-sm font-bold"
                style={{ color: prob.color || getDefaultColor(index) }}
              >
                {prob.value}%
              </div>
            </div>

            {/* Progress Bar */}
            <div 
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ background: "var(--surface-alt)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${prob.value}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 + 0.2 }}
                className="h-full rounded-full"
                style={{ background: prob.color || getDefaultColor(index) }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total */}
      <div 
        className="mt-4 pt-3 border-t text-xs text-center"
        style={{ 
          borderColor: "var(--border)",
          color: "var(--text-secondary)" 
        }}
      >
        Total: {probabilities.reduce((sum, p) => sum + p.value, 0)}%
      </div>
    </motion.div>
  );
}
