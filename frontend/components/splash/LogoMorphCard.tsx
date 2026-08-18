"use client";
import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

interface LogoMorphCardProps {
  isTransitioning: boolean;
}

export function LogoMorphCard({ isTransitioning }: LogoMorphCardProps) {
  // Responsive dimensions based on viewport
  const logoSize = isTransitioning ? "clamp(120px, 30vw, 160px)" : "clamp(64px, 20vw, 80px)";
  const logoHeight = isTransitioning ? "clamp(160px, 40vw, 220px)" : "clamp(64px, 20vw, 80px)";

  return (
    <motion.div
      className="relative"
      initial={{ scale: 1, borderRadius: "50%" }}
      animate={{
        scale: isTransitioning ? 1.1 : 1,
        borderRadius: isTransitioning ? "12px" : "50%",
        width: logoSize,
        height: logoHeight,
      }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      style={{
        background: isTransitioning ? "#000000" : "transparent",
        border: isTransitioning ? `2px solid ${SPLASH_CONFIG.primaryGold}` : "none",
        boxShadow: isTransitioning ? `0 0 20px ${SPLASH_CONFIG.primaryGold}40` : "none",
      }}
    >
      {!isTransitioning && (
        <motion.img
          src="/icon.png"
          alt="Bashiri"
          className="w-full h-full object-contain"
          animate={{ opacity: isTransitioning ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          loading="eager"
          fetchPriority="high"
        />
      )}
      
      {isTransitioning && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="text-white text-sm font-semibold text-center leading-tight">
            Your Journey
          </div>
          <div className="text-yellow-400 text-sm font-bold text-center leading-tight">
            Starts
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}