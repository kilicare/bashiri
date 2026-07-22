"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type ConnectionStatus = "offline" | "reconnecting" | "connected";

export default function OfflinePage() {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus>("offline");
  const [retryCount, setRetryCount] = useState(5);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try fetching a simple resource to check connectivity
        const response = await fetch("/manifest.json", { 
          method: "GET",
          cache: "no-store"
        });
        if (response.ok) {
          setStatus("connected");
          setTimeout(() => {
            router.push("/home");
          }, 1500);
        }
      } catch {
        setStatus("offline");
      }
    };

    const interval = setInterval(() => {
      if (status === "offline") {
        checkConnection();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, router]);

  const handleRetry = async () => {
    setStatus("reconnecting");
    try {
      const response = await fetch("/manifest.json", { 
        method: "GET",
        cache: "no-store"
      });
      if (response.ok) {
        setStatus("connected");
        setTimeout(() => {
          router.push("/home");
        }, 1500);
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    }
  };

  return (
    <div 
      className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ 
        background: "var(--background)",
        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 50%)"
      }}
    >
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 max-w-sm w-full">
        {/* Glass Card */}
        <motion.div
          className="rounded-3xl p-8 text-center"
          style={{
            background: "rgba(17, 18, 24, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.05)"
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated Logo */}
          <motion.div
            className="relative inline-block mb-6"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.img
              src="/icon.png"
              alt="Bashiri AI"
              className="w-24 h-24 object-contain rounded-full"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(212, 175, 55, 0.3)',
                  '0 0 40px rgba(212, 175, 55, 0.6)',
                  '0 0 20px rgba(212, 175, 55, 0.3)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>

          {/* Status */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 
              className="text-2xl font-bold mb-2 tracking-tight"
              style={{ 
                color: status === "connected" ? "#22C55E" : "#F8FAFC",
                fontFamily: "Poppins, sans-serif"
              }}
            >
              {status === "connected" ? "Connected" : "AI Offline"}
            </h2>
            <p 
              className="text-sm"
              style={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              {status === "connected" 
                ? "Live data restored" 
                : status === "reconnecting"
                ? "Reconnecting..."
                : "Waiting for live match data..."
              }
            </p>
          </motion.div>

          {/* Divider */}
          <div 
            className="w-full h-px mb-6"
            style={{ background: "rgba(255, 255, 255, 0.1)" }}
          />

          {/* Message */}
          <motion.p
            className="text-sm mb-6 leading-relaxed"
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {status === "connected"
              ? "Predictions resume now."
              : "Bashiri cannot retrieve match data right now. We'll reconnect automatically."}
          </motion.p>

          {/* Status Indicator */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{
                background: status === "connected" ? "#22C55E" : status === "reconnecting" ? "#F59E0B" : "#EF4444"
              }}
              animate={status === "reconnecting" ? {
                opacity: [1, 0.3, 1],
              } : {}}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            />
            <span 
              className="text-xs uppercase tracking-wider"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              {status === "connected" ? "Online" : status === "reconnecting" ? "Connecting" : "Offline"}
            </span>
          </motion.div>

          {/* Retry Button */}
          {status !== "connected" && (
            <motion.button
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: status === "reconnecting" ? "rgba(212, 175, 55, 0.3)" : "#D4AF37",
                color: status === "reconnecting" ? "rgba(255, 255, 255, 0.5)" : "#09090B",
                boxShadow: status === "reconnecting" ? "none" : "0 0 20px rgba(212, 175, 55, 0.3)"
              }}
              onClick={handleRetry}
              disabled={status === "reconnecting"}
              whileHover={status !== "reconnecting" ? { scale: 1.02 } : {}}
              whileTap={status !== "reconnecting" ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {status === "reconnecting" ? "Connecting..." : "↻ Retry Connection"}
            </motion.button>
          )}

          {/* Auto Retry Message */}
          {status === "offline" && (
            <motion.p
              className="text-xs mt-4"
              style={{ color: "rgba(255, 255, 255, 0.3)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Automatically retrying...
            </motion.p>
          )}
        </motion.div>

        {/* AI Quote */}
        <motion.p
          className="text-xs text-center mt-6 italic"
          style={{ color: "rgba(255, 255, 255, 0.25)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          "Great predictions begin with great data."
        </motion.p>
      </div>
    </div>
  );
}
