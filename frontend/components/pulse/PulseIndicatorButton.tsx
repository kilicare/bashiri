"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";

export function PulseIndicatorButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/pulse")}
      className="relative grid place-items-center rounded-2xl p-4 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--success)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
      style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))", border: "1px solid rgba(212,175,55,0.15)" }}
    >
      <Radar size={24} style={{ color: "var(--text-primary)" }} />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
        style={{ background: "var(--success)" }}
        animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
        style={{
          background: "var(--success)",
          boxShadow: "0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.3)"
        }}
        animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
    </button>
  );
}
