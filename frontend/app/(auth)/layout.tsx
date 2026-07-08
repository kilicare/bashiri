'use client'

import { cloudinaryUrl } from "@/lib/cloudinary";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-dvh flex flex-col justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${cloudinaryUrl("backend_ce2j2d")})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="px-5 pb-safe pb-8 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <motion.div
            className="relative inline-block mb-4"
          >
            <motion.img
              src="/icon.png"
              alt="Bashiri"
              className="w-32 h-32 object-contain rounded-full"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(168,85,247,0.5)',
                  '0 0 40px rgba(168,85,247,0.8)',
                  '0 0 20px rgba(168,85,247,0.5)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
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