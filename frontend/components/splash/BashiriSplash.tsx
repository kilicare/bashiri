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
      className="
        splash-scroll-container
        fixed
        inset-0
        overflow-y-auto
        overscroll-contain
        px-4
        pt-safe
        pb-safe
      "
      style={{
        background: SPLASH_CONFIG.backgroundColor,
        minHeight: "100svh",
        WebkitOverflowScrolling: "touch",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{
        duration: exiting
          ? SPLASH_CONFIG.exitDuration / 1000
          : SPLASH_CONFIG.baseAnimationDuration,
        ease: "easeInOut",
      }}
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="
          fixed
          inset-0
          w-full
          h-full
          object-cover
          z-0
          pointer-events-none
        "
        style={{
          objectFit: "cover",
        }}
      >
        <source
          src="/splash-background.mp4"
          type="video/mp4"
        />
      </video>

      {/* Semi-transparent overlay to ensure content visibility */}
      <div className="fixed inset-0 bg-black/40 z-10 pointer-events-none" />

      {/* Subtle background glow */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)",
        }}
      />

      {/* 
        Scroll-safe content wrapper.

        `min-h-[100svh]` keeps the splash vertically centered
        on normal/tall screens.

        `my-auto` allows the content to naturally move to the
        top when the viewport becomes too short, instead of
        clipping the top/bottom.
      */}
      <div
        className="
          splash-content
          relative
          z-20
          w-full
          min-h-[100svh]
          flex
          flex-col
          items-center
          justify-center
          py-6
          sm:py-8
        "
      >
        <div
          className="
            w-full
            max-w-md
            flex
            flex-col
            items-center
            my-auto
          "
        >
          {/* Hero Card */}
          <div
            className="w-full flex justify-center"
            style={{
              marginBottom: SPLASH_CONFIG.spacingHeroToBrand,
            }}
          >
            <HeroCard />
          </div>

          {/* Brand Header */}
          <motion.div
            className="w-full text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: SPLASH_CONFIG.baseAnimationDuration,
              delay: 0.1,
            }}
            style={{
              marginBottom: SPLASH_CONFIG.spacingBrandToStats,
            }}
          >
            <h1
              className="font-black tracking-wider break-words"
              style={{
                color: SPLASH_CONFIG.white,
                fontSize: SPLASH_CONFIG.brandFontSize,
                letterSpacing: "0.08em",
                textShadow:
                  "0 0 30px rgba(212, 175, 55, 0.3)",
              }}
            >
              {SPLASH_CONFIG.appName}
            </h1>

            <p
              className="font-medium mt-2 break-words"
              style={{
                color: SPLASH_CONFIG.textSecondary,
                fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
              }}
            >
              {SPLASH_CONFIG.tagline}
            </p>
          </motion.div>

          {/* Performance Stats */}
          <div
            className="w-full"
            style={{
              marginBottom: SPLASH_CONFIG.spacingStatsToLeagues,
            }}
          >
            <PerformanceStats />
          </div>

          {/* League Accuracy */}
          <div
            className="w-full"
            style={{
              marginBottom: SPLASH_CONFIG.spacingLeaguesToProgress,
            }}
          >
            <LeagueAccuracy />
          </div>

          {/* Loading Progress */}
          <div
            className="w-full"
            style={{
              marginBottom: SPLASH_CONFIG.spacingProgressToFooter,
            }}
          >
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
      </div>
    </motion.div>
  );
}