"use client";
import { clsx } from "clsx";

interface ConfidenceBadgeProps {
  confidence: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function getConfidenceColor(confidence: number): { bg: string; text: string; border: string } {
  if (confidence >= 90) {
    return {
      bg: "rgba(16, 185, 129, 0.15)",
      text: "#10B981",
      border: "rgba(16, 185, 129, 0.3)"
    };
  }
  if (confidence >= 80) {
    return {
      bg: "rgba(59, 130, 246, 0.15)",
      text: "#3B82F6",
      border: "rgba(59, 130, 246, 0.3)"
    };
  }
  if (confidence >= 60) {
    return {
      bg: "rgba(245, 158, 11, 0.15)",
      text: "#F59E0B",
      border: "rgba(245, 158, 11, 0.3)"
    };
  }
  if (confidence >= 40) {
    return {
      bg: "rgba(249, 115, 22, 0.15)",
      text: "#F97316",
      border: "rgba(249, 115, 22, 0.3)"
    };
  }
  return {
    bg: "rgba(239, 68, 68, 0.15)",
    text: "#EF4444",
    border: "rgba(239, 68, 68, 0.3)"
  };
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return "VERY HIGH";
  if (confidence >= 80) return "HIGH";
  if (confidence >= 60) return "MEDIUM";
  if (confidence >= 40) return "LOW";
  return "VERY RISKY";
}

export function getConfidenceMicrocopy(confidence: number): string {
  if (confidence >= 90) return "Very likely outcome";
  if (confidence >= 80) return "Strong prediction";
  if (confidence >= 60) return "Moderate confidence";
  if (confidence >= 40) return "Lower confidence";
  return "High uncertainty";
}

export function ConfidenceBadge({ confidence, showLabel = true, size = "md" }: ConfidenceBadgeProps) {
  const colors = getConfidenceColor(confidence);
  const label = getConfidenceLabel(confidence);
  
  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5"
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-bold border",
        sizeStyles[size]
      )}
      style={{
        background: colors.bg,
        color: colors.text,
        borderColor: colors.border
      }}
    >
      {showLabel && <span>{label}</span>}
      <span>{confidence.toFixed(1)}%</span>
    </div>
  );
}
