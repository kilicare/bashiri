"use client";
import { useEffect, useState } from "react";
import { getConfidenceColor } from "./ConfidenceBadge";

interface PremiumProgressBarProps {
  value: number;
  height?: number;
  animated?: boolean;
  showGlow?: boolean;
}

export function PremiumProgressBar({ 
  value, 
  height = 6, 
  animated = true,
  showGlow = true 
}: PremiumProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const colors = getConfidenceIconColor(value * 100);

  useEffect(() => {
    if (animated) {
      setProgress(0);
      const timer = setTimeout(() => {
        setProgress(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setProgress(value);
    }
  }, [value, animated]);

  return (
    <div 
      className="w-full rounded-full overflow-hidden relative"
      style={{ 
        height, 
        background: "rgba(255,255,255,0.08)" 
      }}
    >
      <div
        className="h-full rounded-full transition-all duration-600 ease-out relative"
        style={{ 
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          background: `linear-gradient(90deg, ${colors.start}, ${colors.end})`,
          boxShadow: showGlow ? `0 0 12px ${colors.start}40` : 'none'
        }}
      >
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
          }}
        />
      </div>
    </div>
  );
}

function getConfidenceIconColor(confidence: number): { start: string; end: string } {
  if (confidence >= 90) {
    return { start: "#10B981", end: "#34D399" };
  }
  if (confidence >= 80) {
    return { start: "#3B82F6", end: "#60A5FA" };
  }
  if (confidence >= 60) {
    return { start: "#F59E0B", end: "#FBBF24" };
  }
  if (confidence >= 40) {
    return { start: "#F97316", end: "#FB923C" };
  }
  return { start: "#EF4444", end: "#F87171" };
}
