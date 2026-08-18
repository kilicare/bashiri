"use client";
import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

interface GoalPostLoaderProps {
  progress: number; // 0-100
}

export function GoalPostLoader({ progress }: GoalPostLoaderProps) {
  const safeProgress = Math.min(progress, 100);
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-sm px-4">
      {/* Modern Progress Bar Container */}
      <div className="w-48 sm:w-56 relative">
        {/* Background Track */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          {/* Progress Fill with Gradient */}
          <motion.div
            className="h-full rounded-full relative"
            style={{
              width: `${safeProgress}%`,
              background: `linear-gradient(90deg, ${SPLASH_CONFIG.primaryGold}, ${SPLASH_CONFIG.secondaryGold})`,
            }}
            animate={!prefersReducedMotion ? {
              boxShadow: [
                `0 0 8px ${SPLASH_CONFIG.primaryGold}40`,
                `0 0 16px ${SPLASH_CONFIG.primaryGold}60`,
                `0 0 8px ${SPLASH_CONFIG.primaryGold}40`,
              ],
            } : undefined}
            transition={!prefersReducedMotion ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            } : undefined}
          >
            {/* Shimmer Effect */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Football-Themed End Markers */}
        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/30" />
        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/30" />
      </div>

      {/* Modern Progress Text */}
      <div className="flex items-center gap-2">
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: SPLASH_CONFIG.primaryGold,
          }}
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
          className="text-white/90 text-xs sm:text-sm font-semibold tracking-wide"
          animate={!prefersReducedMotion ? {
            opacity: [0.7, 1, 0.7],
          } : undefined}
          transition={!prefersReducedMotion ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          } : undefined}
        >
          {safeProgress}%
        </motion.p>
      </div>
    </div>
  );
}