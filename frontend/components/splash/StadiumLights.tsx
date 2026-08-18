"use client";
import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

export function StadiumLights() {
  const particlePositions = [
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 50, y: 20 },
    { x: 20, y: 50 },
    { x: 80, y: 50 },
    { x: 50, y: 80 },
    { x: 15, y: 85 },
    { x: 85, y: 85 },
  ];

  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particlePositions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full w-1.5 h-1.5 sm:w-2 sm:h-2"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            background: SPLASH_CONFIG.primaryGold,
            boxShadow: prefersReducedMotion ? "none" : `0 0 8px ${SPLASH_CONFIG.primaryGold}`,
          }}
          animate={prefersReducedMotion ? { opacity: 0.4 } : {
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.3, 1],
            boxShadow: [
              `0 0 4px ${SPLASH_CONFIG.primaryGold}`,
              `0 0 12px ${SPLASH_CONFIG.primaryGold}`,
              `0 0 4px ${SPLASH_CONFIG.primaryGold}`,
            ],
          }}
          transition={prefersReducedMotion ? {} : {
            duration: 2.5 + i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}