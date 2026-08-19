"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

interface LoadingProgressProps {
  progress: number;
  loadingMessage: string;
  error: Error | null;
  onRetry: () => void;
}

export function LoadingProgress({ progress, loadingMessage, error, onRetry }: LoadingProgressProps) {
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  if (error) {
    return (
      <motion.div
        className="w-full max-w-sm mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div
          className="text-sm font-medium mb-3"
          style={{ color: "rgba(239, 68, 68, 0.8)" }}
        >
          Initialization failed
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: SPLASH_CONFIG.primaryGold,
            color: "#000000",
          }}
        >
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* Progress bar */}
      <div className="relative">
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.1)" }}
        >
          <motion.div
            className="h-full rounded-full relative"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${SPLASH_CONFIG.primaryGold}, ${SPLASH_CONFIG.secondaryGold})`,
            }}
          >
            {/* Shimmer effect */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Progress text and message */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: SPLASH_CONFIG.primaryGold }}
            animate={!prefersReducedMotion ? {
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            } : undefined}
            transition={!prefersReducedMotion ? {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            } : undefined}
          />
          <motion.p
            className="text-xs font-medium"
            style={{ color: SPLASH_CONFIG.textSecondary }}
            animate={!prefersReducedMotion ? {
              opacity: [0.7, 1, 0.7],
            } : undefined}
            transition={!prefersReducedMotion ? {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            } : undefined}
          >
            {progress}%
          </motion.p>
        </div>

        <div className="flex items-center gap-2">
          <Rocket size={14} style={{ color: SPLASH_CONFIG.primaryGold }} />
          <motion.p
            className="text-xs font-medium text-right"
            style={{ color: SPLASH_CONFIG.textSecondary }}
            animate={!prefersReducedMotion ? {
              opacity: [0.7, 1, 0.7],
            } : undefined}
            transition={!prefersReducedMotion ? {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            } : undefined}
          >
            {loadingMessage}
          </motion.p>
        </div>
      </div>
    </div>
  );
}