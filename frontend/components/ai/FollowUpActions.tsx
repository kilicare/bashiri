"use client";

import { motion } from "framer-motion";
import { ArrowRight, Plus, BarChart3, TrendingUp } from "lucide-react";

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface FollowUpActionsProps {
  actions: Action[];
}

export function FollowUpActions({ actions }: FollowUpActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.5 }}
      className="mt-4"
    >
      <div 
        className="text-xs font-medium mb-3"
        style={{ color: "var(--text-secondary)" }}
      >
        Want more?
      </div>
      
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
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
            {action.icon}
            <span>{action.label}</span>
            <ArrowRight size={14} style={{ color: "var(--brand-primary)" }} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Preset action icons for common use
export const ActionIcons = {
  compare: <TrendingUp size={16} />,
  analyze: <BarChart3 size={16} />,
  predict: <Plus size={16} />,
};
