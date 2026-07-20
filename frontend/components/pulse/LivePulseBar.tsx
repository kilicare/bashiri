"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PulseSummary } from "@/lib/api/pulse";

export function LivePulseBar({ stats }: { stats: PulseSummary["stats"] }) {
  const items = [
    stats.live_rooms > 0 && { icon: "🔴", text: `${stats.live_rooms} Rooms Live Sasa` },
    stats.mic_videos_today > 0 && { icon: "🎤", text: `${stats.mic_videos_today} Video za Mic Leo` },
    stats.open_debates > 0 && { icon: "🗣", text: `${stats.open_debates} Debates Zinaendelea` },
    stats.ai_weekly_accuracy !== null && { icon: "🎯", text: `AI Sahihi ${stats.ai_weekly_accuracy}% Wiki Hii` },
  ].filter(Boolean) as { icon: string; text: string }[];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % items.length), 3000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="h-8 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="text-xs font-bold flex items-center gap-1.5"
          style={{ color: "#00FF87" }}
        >
          <span>{items[index].icon}</span>
          <span>{items[index].text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
