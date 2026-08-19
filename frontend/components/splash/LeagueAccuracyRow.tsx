"use client";

import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";
import { useCountUp } from "@/hooks/useCountUp";

interface LeagueAccuracyRowProps {
  name: string;
  flag: string;
  accuracy: number;
  index: number;
}

export function LeagueAccuracyRow({ name, flag, accuracy, index }: LeagueAccuracyRowProps) {
  const animatedAccuracy = useCountUp(accuracy, 1200);
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: SPLASH_CONFIG.baseAnimationDuration, 
        delay: 0.4 + index * SPLASH_CONFIG.staggerDelay,
        ease: "easeOut" 
      }}
    >
      {/* League flag */}
      <div className="text-2xl flex-shrink-0">{flag}</div>
      
      {/* League name and progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: SPLASH_CONFIG.white }}
          >
            {name}
          </span>
          <span
            className="text-sm font-bold ml-2"
            style={{ color: SPLASH_CONFIG.aiGreen }}
          >
            {animatedAccuracy}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div 
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.1)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${SPLASH_CONFIG.primaryGold}, ${SPLASH_CONFIG.secondaryGold})`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ 
              duration: SPLASH_CONFIG.progressAnimationDuration,
              delay: 0.5 + index * SPLASH_CONFIG.staggerDelay,
              ease: "easeOut" 
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}