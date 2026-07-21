"use client";

import { motion } from "framer-motion";

interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showPercentage?: boolean;
}

export function ConfidenceIndicator({ 
  confidence, 
  size = "md", 
  showLabel = true,
  showPercentage = true 
}: ConfidenceIndicatorProps) {
  const sizes = {
    sm: { height: "h-2", text: "text-xs" },
    md: { height: "h-3", text: "text-sm" },
    lg: { height: "h-4", text: "text-base" },
  };

  const getConfidenceColor = (value: number) => {
    if (value >= 80) return "var(--brand-primary)";
    if (value >= 60) return "var(--brand-accent)";
    if (value >= 40) return "var(--warning)";
    return "var(--danger)";
  };

  const getConfidenceLabel = (value: number) => {
    if (value >= 80) return "High";
    if (value >= 60) return "Medium";
    if (value >= 40) return "Moderate";
    return "Low";
  };

  return (
    <div className="flex flex-col gap-2">
      {(showLabel || showPercentage) && (
        <div className="flex items-center justify-between">
          {showLabel && (
            <span 
              className={`font-medium ${sizes[size].text}`}
              style={{ color: "var(--text-secondary)" }}
            >
              Confidence
            </span>
          )}
          {showPercentage && (
            <span 
              className={`font-bold ${sizes[size].text}`}
              style={{ color: getConfidenceColor(confidence) }}
            >
              {confidence}%
            </span>
          )}
        </div>
      )}
      
      <div 
        className={`w-full ${sizes[size].height} rounded-full overflow-hidden`}
        style={{ background: "var(--surface-alt)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${sizes[size].height}`}
          style={{ background: getConfidenceColor(confidence) }}
        />
      </div>
      
      {showLabel && (
        <div 
          className={`text-xs font-medium`}
          style={{ color: getConfidenceColor(confidence) }}
        >
          {getConfidenceLabel(confidence)} Confidence
        </div>
      )}
    </div>
  );
}
