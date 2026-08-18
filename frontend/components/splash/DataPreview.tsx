"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

interface LeagueData {
  name: string;
  accuracy: number;
}

const LEAGUE_DATA: LeagueData[] = [
  { name: "EPL", accuracy: 87 },
  { name: "La Liga", accuracy: 85 },
  { name: "Serie A", accuracy: 82 },
  { name: "Bundesliga", accuracy: 84 },
  { name: "Ligue 1", accuracy: 81 },
];

export function DataPreview() {
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleIndex((prev) => (prev + 1) % LEAGUE_DATA.length);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Show all leagues but use responsive CSS to handle mobile display
  const displayData = LEAGUE_DATA;

  return (
    <motion.div
      className="mt-4 sm:mt-6 space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
    >
      <p className="text-xs sm:text-sm text-white/60 font-medium">Top League Accuracy</p>
      <div className="space-y-1">
        {LEAGUE_DATA.map((league, index) => (
          <motion.div
            key={league.name}
            className={`flex items-center justify-between text-xs sm:text-sm ${index >= 3 ? 'hidden sm:flex' : ''}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: index <= visibleIndex ? 1 : 0.3,
              x: index <= visibleIndex ? 0 : -10,
            }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white/80">{league.name}</span>
            <span
              className="font-semibold"
              style={{ color: SPLASH_CONFIG.aiGreen }}
            >
              {league.accuracy}%
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}