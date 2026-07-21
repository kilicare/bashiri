"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ContextChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface ContextChipsProps {
  chips: ContextChip[];
  title?: string;
}

export function ContextChips({ chips, title = "Explore more" }: ContextChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.6 }}
      className="mt-4"
    >
      {title && (
        <div 
          className="text-xs font-medium mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <motion.button
            key={chip.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={chip.onClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.3)";
              e.currentTarget.style.background = "var(--surface-alt)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {chip.icon && <span>{chip.icon}</span>}
            <span>{chip.label}</span>
            <ArrowRight size={14} style={{ color: "var(--brand-primary)" }} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
