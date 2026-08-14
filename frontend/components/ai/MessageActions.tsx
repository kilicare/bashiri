"use client";

import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface MessageActionsProps {
  onCopy?: () => void;
  show?: boolean;
}

export function MessageActions({ onCopy, show = false }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  // Always show copy button for mobile accessibility
  if (!onCopy) return null;

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 mt-2"
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className="p-2 rounded-lg transition-all"
        style={{
          background: copied ? "var(--success)" : "var(--glass-bg)",
          color: copied ? "#fff" : "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.background = "var(--glass-bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.background = "var(--glass-bg)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
        aria-label={copied ? "Copied!" : "Copy message"}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </motion.button>
    </motion.div>
  );
}
