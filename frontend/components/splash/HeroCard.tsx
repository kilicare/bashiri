"use client";

import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

export function HeroCard() {
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: SPLASH_CONFIG.baseAnimationDuration, ease: "easeOut" }}
      style={{
        width: "clamp(140px, 35vw, 180px)",
        height: "clamp(140px, 35vw, 180px)",
      }}
    >
      {/* Gold border with subtle glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          border: "2px solid rgba(212, 175, 55, 0.3)",
          background: "rgba(212, 175, 55, 0.05)",
          boxShadow: prefersReducedMotion ? "none" : "0 0 30px rgba(212, 175, 55, 0.15)",
        }}
        animate={!prefersReducedMotion ? {
          boxShadow: [
            "0 0 30px rgba(212, 175, 55, 0.15)",
            "0 0 40px rgba(212, 175, 55, 0.25)",
            "0 0 30px rgba(212, 175, 55, 0.15)",
          ],
        } : undefined}
        transition={!prefersReducedMotion ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        } : undefined}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {/* Logo image */}
        <motion.div
          className="relative mb-3"
          animate={!prefersReducedMotion ? {
            y: [0, -8, 0],
          } : undefined}
          transition={!prefersReducedMotion ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          } : undefined}
        >
          <img
            src="/icon.png"
            alt="Bashiri Logo"
            className="w-16 h-16 object-contain rounded-2xl"
            loading="eager"
            fetchPriority="high"
            style={{
              borderRadius: "24px",
            }}
          />
        </motion.div>

        {/* Text */}
        <div className="text-center">
          <div
            className="text-lg font-bold leading-tight"
            style={{ 
              color: SPLASH_CONFIG.white,
              fontSize: SPLASH_CONFIG.heroFontSize,
            }}
          >
            {SPLASH_CONFIG.heroTitle}
          </div>
          <div
            className="text-lg font-black leading-tight"
            style={{ 
              color: SPLASH_CONFIG.primaryGold,
              fontSize: SPLASH_CONFIG.heroFontSize,
            }}
          >
            {SPLASH_CONFIG.heroSubtitle}
          </div>
        </div>
      </div>
    </motion.div>
  );
}