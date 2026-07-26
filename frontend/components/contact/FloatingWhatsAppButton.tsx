"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

export function FloatingWhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.open("https://wa.me/255650745642", "_blank");
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.4 }}
      className="fixed bottom-24 right-4 z-40"
      aria-label="Wasiliana nasi kwa WhatsApp"
    >
      {/* Glow Effect */}
      <motion.div
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: isHovered ? 0.6 : 0.3,
        }}
        transition={{
          duration: 1.5,
          repeat: isHovered ? Infinity : 0,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(37, 211, 102, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Button */}
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm"
        style={{
          background: "rgba(17, 18, 24, 0.8)",
          border: "2px solid rgba(37, 211, 102, 0.6)",
          boxShadow: isHovered
            ? "0 0 30px rgba(37, 211, 102, 0.5), 0 0 60px rgba(37, 211, 102, 0.3)"
            : "0 0 20px rgba(37, 211, 102, 0.3), 0 0 40px rgba(37, 211, 102, 0.2)",
        }}
      >
        <MessageCircle
          size={28}
          strokeWidth={2.5}
          style={{ color: "#25D366" }}
        />
      </div>

      {/* Tooltip */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap"
          style={{
            background: "rgba(17, 18, 24, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span className="text-xs font-semibold text-white">Wasiliana Nasi</span>
        </motion.div>
      )}
    </motion.button>
  );
}
