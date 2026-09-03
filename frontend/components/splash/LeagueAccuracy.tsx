"use client";

import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";
import { LeagueAccuracyRow } from "./LeagueAccuracyRow";

export function LeagueAccuracy() {
  return (
    <motion.div
      className="
        w-full
        max-w-sm
        mx-auto
        min-w-0
      "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: SPLASH_CONFIG.baseAnimationDuration,
        delay: 0.3,
      }}
    >
      {/* Header */}
      <div
        className="
          text-xs
          font-semibold
          mb-4
          uppercase
          tracking-wider
          break-words
        "
        style={{
          color: SPLASH_CONFIG.textSecondary,
        }}
      >
        Top League Accuracy
      </div>

      {/* League cards */}
      <div className="space-y-3 w-full min-w-0">
        {SPLASH_CONFIG.leagueData.map((league, index) => (
          <LeagueAccuracyRow
            key={league.name}
            name={league.name}
            flag={league.flag}
            accuracy={league.accuracy}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}