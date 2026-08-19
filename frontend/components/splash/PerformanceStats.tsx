"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";
import { useCountUp } from "@/hooks/useCountUp";

export function PerformanceStats() {
  const accuracy = useCountUp(SPLASH_CONFIG.accuracyPercentage, 1500);
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  return (
    <motion.div
      className="relative rounded-2xl p-4 w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: SPLASH_CONFIG.baseAnimationDuration, delay: 0.2 }}
      style={{
        background: SPLASH_CONFIG.surface,
        border: `1px solid ${SPLASH_CONFIG.surfaceBorder}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Accuracy Section */}
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(212, 175, 55, 0.1)",
              border: "1px solid rgba(212, 175, 55, 0.2)",
            }}
          >
            <Target size={18} style={{ color: SPLASH_CONFIG.primaryGold }} />
          </div>
          <div>
            <div
              className="text-xl font-bold"
              style={{ 
                color: SPLASH_CONFIG.white,
                fontSize: SPLASH_CONFIG.statsFontSize,
              }}
            >
              {accuracy}%
            </div>
            <div
              className="text-xs font-medium"
              style={{ color: SPLASH_CONFIG.textSecondary }}
            >
              Accuracy
            </div>
          </div>
        </div>

        {/* Divider */}
        <div 
          className="w-px h-8"
          style={{ background: SPLASH_CONFIG.surfaceBorder }}
        />

        {/* Rating Section */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  className="text-sm"
                  style={{ color: SPLASH_CONFIG.primaryGold }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.3 + i * 0.05,
                    ease: "easeOut" 
                  }}
                >
                  ★
                </motion.span>
              ))}
            </div>
            <div
              className="text-xs font-medium"
              style={{ color: SPLASH_CONFIG.textSecondary }}
            >
              {SPLASH_CONFIG.rating}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}