"use client";

import { Copy } from "lucide-react";
import { motion } from "framer-motion";

interface MessageActionsProps {
  onCopy?: () => void;
  show?: boolean;
}

export function MessageActions({ onCopy, show = false }: MessageActionsProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 mt-2"
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onCopy}
        className="p-2 rounded-lg transition-all"
        style={{
          background: "var(--glass-bg)",
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--glass-bg-hover)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--glass-bg)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
        aria-label="Copy message"
      >
        <Copy size={14} />
      </motion.button>
    </motion.div>
  );
}
