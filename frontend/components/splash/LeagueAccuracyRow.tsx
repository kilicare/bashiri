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

export function LeagueAccuracyRow({
  name,
  flag,
  accuracy,
  index,
}: LeagueAccuracyRowProps) {
  const animatedAccuracy = useCountUp(accuracy, 1200);

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      : false;

  return (
    <motion.div
      className="
        relative
        rounded-2xl
        p-4
        w-full
        min-w-0
        overflow-hidden
      "
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: SPLASH_CONFIG.baseAnimationDuration,
        delay:
          0.4 + index * SPLASH_CONFIG.staggerDelay,
        ease: "easeOut",
      }}
      style={{
        background: SPLASH_CONFIG.surface,
        border: `1px solid ${SPLASH_CONFIG.surfaceBorder}`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          min-w-0
        "
      >
        {/* League Section */}
        <div
          className="
            flex
            items-center
            gap-3
            flex-1
            min-w-0
          "
        >
          {/* League Flag */}
          <div
            className="
              w-10
              h-10
              rounded-xl
              flex
              items-center
              justify-center
              flex-shrink-0
            "
            style={{
              background:
                "rgba(212, 175, 55, 0.1)",
              border:
                "1px solid rgba(212, 175, 55, 0.2)",
            }}
          >
            <span className="text-xl leading-none">
              {flag}
            </span>
          </div>

          {/* League Information */}
          <div className="min-w-0 flex-1">
            <div
              className="
                text-sm
                font-semibold
                truncate
              "
              style={{
                color: SPLASH_CONFIG.white,
              }}
              title={name}
            >
              {name}
            </div>

            <div
              className="
                text-xs
                font-medium
                truncate
              "
              style={{
                color:
                  SPLASH_CONFIG.textSecondary,
              }}
            >
              League Accuracy
            </div>
          </div>
        </div>

        {/* Accuracy Percentage */}
        <div
          className="
            flex
            items-center
            gap-2
            flex-shrink-0
          "
        >
          <div
            className="
              text-xl
              font-bold
              whitespace-nowrap
            "
            style={{
              color: SPLASH_CONFIG.aiGreen,
              fontSize:
                SPLASH_CONFIG.statsFontSize,
            }}
          >
            {animatedAccuracy}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}