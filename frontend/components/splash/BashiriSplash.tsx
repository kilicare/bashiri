"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";
import { GoalPostLoader } from "./GoalPostLoader";
import { StadiumLights } from "./StadiumLights";
import { TrustIndicators } from "./TrustIndicators";
import { LogoMorphCard } from "./LogoMorphCard";
import { InteractiveSplash } from "./InteractiveSplash";
import { DataPreview } from "./DataPreview";

const SPLASH_SESSION_KEY = "bashiri_splash_shown";

// Motion reduction support
const prefersReducedMotion = typeof window !== "undefined" 
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
  : false;

export function BashiriSplash() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const alreadySeen =
    typeof window !== "undefined" && sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";

  useEffect(() => {
    if (alreadySeen) {
      router.replace("/home");
      return;
    }
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) return prev + 10;
        // Trigger logo morph when progress completes
        if (prev === 100) setIsTransitioning(true);
        return 100;
      });
    }, 350);
    
    const displayTimer = setTimeout(() => setExiting(true), SPLASH_CONFIG.displayDuration);
    
    return () => {
      clearInterval(progressInterval);
      clearTimeout(displayTimer);
    };
  }, [alreadySeen, router]);

  useEffect(() => {
    if (!exiting) return;
    const exitTimer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
      router.replace("/home");
    }, SPLASH_CONFIG.exitDuration);
    return () => clearTimeout(exitTimer);
  }, [exiting, router]);

  // Mtumiaji anayerudi ndani ya session hiyo hiyo — hakuna splash tena,
  // tunaruka moja kwa moja (background nyeusi tu, imefifia haraka sana).
  if (alreadySeen) {
    return <div className="fixed inset-0" style={{ background: "#000000" }} />;
  }

  return (
    <InteractiveSplash>
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-safe pb-safe"
        style={{
          background: "#000000",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: exiting ? SPLASH_CONFIG.exitDuration / 1000 : SPLASH_CONFIG.baseAnimationDuration, ease: "easeInOut" }}
      >
      {/* Stadium Lights Background */}
      <StadiumLights />

      {/* Glow nyuma ya logo - zaidi dramatic */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "clamp(120px, 25vw, 200px)",
          height: "clamp(120px, 25vw, 200px)",
          background: "radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 75%)",
          filter: prefersReducedMotion ? "none" : "blur(20px)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={prefersReducedMotion ? { opacity: 1, scale: 1 } : { 
          opacity: [0, 1, 0.8, 1],
          scale: [0.5, 1, 1.05, 1],
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0.5 : 2, 
          delay: 0.2, 
          ease: "easeOut",
          times: prefersReducedMotion ? undefined : [0, 0.5, 0.75, 1],
        }}
      />

      {/* Logo — twiga wa Bashiri, hero element */}
      <div className="relative z-10">
        <LogoMorphCard isTransitioning={isTransitioning} />
      </div>

      {/* Jina na tagline - zaidi dramatic */}
      <motion.div
        className="relative mt-4 sm:mt-6 lg:mt-8 text-center w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl"
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
      >
        <motion.p
          className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-wide"
          style={{ 
            color: "#FFFFFF",
            textShadow: prefersReducedMotion ? "none" : "0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.3)",
          }}
          animate={prefersReducedMotion ? undefined : {
            textShadow: [
              "0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.3)",
              "0 0 40px rgba(212,175,55,0.7), 0 0 80px rgba(212,175,55,0.5)",
              "0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.3)",
            ],
          }}
          transition={prefersReducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          BASHIRI
        </motion.p>
        <motion.p
          className="text-xs sm:text-sm lg:text-base mt-2 sm:mt-3 font-semibold tracking-wide text-center max-w-xs sm:max-w-sm lg:max-w-md mx-auto leading-relaxed"
          style={{ 
            color: "rgba(255,255,255,0.8)",
            textShadow: prefersReducedMotion ? "none" : "0 0 20px rgba(212,175,55,0.3)",
          }}
          animate={prefersReducedMotion ? undefined : {
            opacity: [0.6, 1, 0.6],
          }}
          transition={prefersReducedMotion ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {SPLASH_CONFIG.tagline}
        </motion.p>

        {/* Trust Indicators */}
        <div className="mt-4 sm:mt-5">
          <TrustIndicators />
        </div>

        {/* Data Preview */}
        <div className="mt-3 sm:mt-4">
          <DataPreview />
        </div>

        {/* Goal Post Loader */}
        <motion.div
          className="mt-5 sm:mt-6 mb-6 sm:mb-8 w-full flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <GoalPostLoader progress={progress} />
        </motion.div>
      </motion.div>
    </motion.div>
    </InteractiveSplash>
  );
}