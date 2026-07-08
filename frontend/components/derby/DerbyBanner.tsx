"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getActiveDerby, ActiveDerby } from "@/lib/api/derby";

function useCountdown(target?: string) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!target) return;
    const interval = setInterval(() => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("00:00:00");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return remaining;
}

export function DerbyBanner() {
  const router = useRouter();
  const [derby, setDerby] = useState<ActiveDerby | null>(null);
  const countdown = useCountdown(derby?.starts_at && derby?.match_id ? undefined : undefined);
  const kickoffCountdown = useCountdown(derby?.ends_at);

  useEffect(() => {
    getActiveDerby().then((data) => {
      if (data.active) setDerby(data);
    });
  }, []);

  if (!derby || !derby.active) return null;

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
    >
      <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: derby.theme_accent_color }}>
        🔥 {derby.derby_name || "Derby Week"}
      </p>
      <div className="flex items-center justify-between">
        <p className="text-lg font-black text-white">
          {derby.home_team_detail?.name} <span style={{ color: derby.theme_accent_color }}>vs</span> {derby.away_team_detail?.name}
        </p>
        <span className="text-sm font-mono font-bold" style={{ color: derby.theme_accent_color }}>{kickoffCountdown}</span>
      </div>
    </motion.button>
  );
}