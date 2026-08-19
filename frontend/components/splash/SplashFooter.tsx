"use client";

import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

export function SplashFooter() {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: SPLASH_CONFIG.baseAnimationDuration, delay: 0.6 }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(212, 175, 55, 0.1)",
          border: "1px solid rgba(212, 175, 55, 0.2)",
        }}
      >
        <span className="text-xs">⚽</span>
      </div>
      <span
        className="text-xs font-semibold tracking-wider"
        style={{ color: SPLASH_CONFIG.textSecondary }}
      >
        {SPLASH_CONFIG.appName}
      </span>
    </motion.div>
  );
}