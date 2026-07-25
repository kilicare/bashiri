'use client'

import { motion } from "framer-motion";
import { House } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="min-h-dvh flex flex-col justify-center relative overflow-hidden"
      style={{
        backgroundColor: "#0A0A0A",
        backgroundImage: `url(/bashiri_new.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Floating Home Button */}
      <motion.button
        onClick={() => router.push("/")}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Go to Home"
        className="fixed top-6 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center outline-none focus:ring-2 focus:ring-white/50"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.05, boxShadow: "0 6px 25px rgba(0, 0, 0, 0.4)" }}
        whileTap={{ scale: 0.95 }}
      >
        <House size={20} className="text-white/70" strokeWidth={1.5} />
      </motion.button>

      {/* Desktop Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="fixed top-6 left-20 z-50 px-3 py-1.5 rounded-lg text-xs font-medium hidden md:block"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          Home / Continue as Guest
        </motion.div>
      )}

      {/* Old background code - commented out
        backgroundImage: `url(/login_background.png)`,
      */}
      <div className="px-5 pb-safe pb-8 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <motion.div
            className="relative inline-block mb-4"
          >
            <motion.img
              src="/icon.png"
              alt="Bashiri"
              className="w-28 h-28 object-contain rounded-full"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(59,130,246,0.5)',
                  '0 0 40px rgba(59,130,246,0.8)',
                  '0 0 20px rgba(59,130,246,0.5)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
            Bashiri
          </h2>
          <p className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
            AI Predictions • Live Scores • Insights
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}