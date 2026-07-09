"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getActiveDerby, ActiveDerby, ActiveDerbyResponse } from "@/lib/api/derby";

function getCountdown(target?: string): string {
  if (!target) return "00:00:00";
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "00:00:00";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function DerbyCard({ derby, index, countdown }: { derby: ActiveDerby; index: number; countdown: string }) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push("/derby")}
      className="w-full mx-4 mb-4 rounded-3xl p-5 text-left"
      style={{
        background: `linear-gradient(135deg, ${derby.theme_accent_color}22, #0A0A0A)`,
        border: `1px solid ${derby.theme_accent_color}55`,
        width: "calc(100% - 32px)",
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: derby.theme_accent_color }}>
        🔥 {derby.derby_name || "Derby Week"}
      </p>
      <div className="flex items-center justify-between">
        <p className="text-lg font-black text-white">
          {derby.home_team_detail?.name} <span style={{ color: derby.theme_accent_color }}>vs</span> {derby.away_team_detail?.name}
        </p>
        <span className="text-sm font-mono font-bold" style={{ color: derby.theme_accent_color }}>{countdown}</span>
      </div>
    </motion.button>
  );
}

export function DerbyBanner() {
  const [derbies, setDerbies] = useState<ActiveDerby[]>([]);
  const [countdowns, setCountdowns] = useState<Record<number, string>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getActiveDerby().then((data: ActiveDerbyResponse) => {
      if (data.active && data.derbies.length > 0) {
        setDerbies(data.derbies);
        // Initialize countdowns
        const initialCountdowns: Record<number, string> = {};
        data.derbies.forEach((derby, idx) => {
          initialCountdowns[idx] = getCountdown(derby.ends_at);
        });
        setCountdowns(initialCountdowns);
      }
    });
  }, []);

  useEffect(() => {
    if (derbies.length === 0) return;

    // Update countdowns every second
    intervalRef.current = setInterval(() => {
      setCountdowns(prev => {
        const newCountdowns: Record<number, string> = {};
        derbies.forEach((derby, idx) => {
          newCountdowns[idx] = getCountdown(derby.ends_at);
        });
        return newCountdowns;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [derbies]);

  if (derbies.length === 0) return null;

  return (
    <div className="space-y-3">
      {derbies.map((derby, index) => (
        <DerbyCard key={derby.id || index} derby={derby} index={index} countdown={countdowns[index] || "00:00:00"} />
      ))}
    </div>
  );
}