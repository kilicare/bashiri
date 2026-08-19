"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";
import { useSplashInitialization } from "@/hooks/useSplashInitialization";
import { HeroCard } from "./HeroCard";
import { PerformanceStats } from "./PerformanceStats";
import { LeagueAccuracy } from "./LeagueAccuracy";
import { LoadingProgress } from "./LoadingProgress";
import { SplashFooter } from "./SplashFooter";

const SPLASH_SESSION_KEY = "bashiri_splash_shown";

export function BashiriSplash() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const { state, progress, loadingMessage, error, retry } = useSplashInitialization();

  const alreadySeen =
    typeof window !== "undefined" && sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";

  useEffect(() => {
    if (alreadySeen) {
      router.replace("/home");
      return;
    }
  }, [alreadySeen, router]);

  useEffect(() => {
    if (state === "READY" && !exiting) {
      const exitTimer = setTimeout(() => {
        setExiting(true);
      }, 200); // Small delay before starting exit animation
      
      return () => clearTimeout(exitTimer);
    }
  }, [state, exiting]);

  useEffect(() => {
    if (exiting) {
      const navigateTimer = setTimeout(() => {
        sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
        router.replace("/home");
      }, SPLASH_CONFIG.exitDuration);
      
      return () => clearTimeout(navigateTimer);
    }
  }, [exiting, router]);

  // Mtumiaji anayerudi ndani ya session hiyo hiyo — hakuna splash tena
  if (alreadySeen) {
    return <div className="fixed inset-0" style={{ background: "#000000" }} />;
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-4 pt-safe pb-safe"
      style={{
        background: SPLASH_CONFIG.backgroundColor,
        minHeight: "100dvh",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ 
        duration: exiting ? SPLASH_CONFIG.exitDuration / 1000 : SPLASH_CONFIG.baseAnimationDuration,
        ease: "easeInOut" 
      }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Hero Card */}
        <div className="mb-6" style={{ marginBottom: `${SPLASH_CONFIG.spacingHeroToBrand}rem` }}>
          <HeroCard />
        </div>

        {/* Brand Header */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: SPLASH_CONFIG.baseAnimationDuration, delay: 0.1 }}
          style={{ marginBottom: `${SPLASH_CONFIG.spacingBrandToStats}rem` }}
        >
          <h1
            className="font-black tracking-wider"
            style={{
              color: SPLASH_CONFIG.white,
              fontSize: SPLASH_CONFIG.brandFontSize,
              letterSpacing: "0.08em",
              textShadow: "0 0 30px rgba(212, 175, 55, 0.3)",
            }}
          >
            {SPLASH_CONFIG.appName}
          </h1>
          <p
            className="text-sm font-medium mt-2"
            style={{ 
              color: SPLASH_CONFIG.textSecondary,
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
            }}
          >
            {SPLASH_CONFIG.tagline}
          </p>
        </motion.div>

        {/* Performance Stats */}
        <div className="w-full mb-4" style={{ marginBottom: `${SPLASH_CONFIG.spacingStatsToLeagues}rem` }}>
          <PerformanceStats />
        </div>

        {/* League Accuracy */}
        <div className="w-full mb-6" style={{ marginBottom: `${SPLASH_CONFIG.spacingLeaguesToProgress}rem` }}>
          <LeagueAccuracy />
        </div>

        {/* Loading Progress */}
        <div className="w-full mb-4" style={{ marginBottom: `${SPLASH_CONFIG.spacingProgressToFooter}rem` }}>
          <LoadingProgress
            progress={progress}
            loadingMessage={loadingMessage}
            error={error}
            onRetry={retry}
          />
        </div>

        {/* Splash Footer */}
        <SplashFooter />
      </div>
    </motion.div>
  );
}