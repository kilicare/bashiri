"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

export function TrustIndicators() {
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAccuracy((prev) => {
        if (prev < SPLASH_CONFIG.accuracyPercentage) return prev + 17;
        return SPLASH_CONFIG.accuracyPercentage;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="mt-4 text-center space-y-1.5 sm:space-y-2"
    >
      <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
        <span className="font-semibold text-white">{accuracy}%</span> Accuracy
      </p>
      <p className="text-xs sm:text-sm text-yellow-400 leading-relaxed">⭐⭐⭐⭐⭐ {SPLASH_CONFIG.rating}</p>
    </motion.div>
  );
}