"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      {/* AI Avatar */}
      <div 
        className="w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{
          background: "var(--gradient-gold)",
          color: "#000",
        }}
      >
        B
      </div>

      {/* Typing Dots Container */}
      <div 
        className="px-4 py-3 rounded-3xl rounded-bl-sm border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--brand-primary)" }}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
