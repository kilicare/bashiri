"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";

interface MessageToolbarProps {
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  show?: boolean;
  isMobile?: boolean;
}

export function MessageToolbar({
  onHelpful,
  onNotHelpful,
  show = false,
  isMobile = false
}: MessageToolbarProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<"helpful" | "not-helpful" | null>(null);

  const handleFeedback = (type: "helpful" | "not-helpful") => {
    setFeedbackGiven(type);
    if (type === "helpful") {
      onHelpful?.();
    } else {
      onNotHelpful?.();
    }
  };

  if (!show) return null;

  const toolbarActions = [
    {
      icon: <ThumbsUp size={14} />,
      label: "Helpful",
      onClick: () => handleFeedback("helpful"),
      show: !!onHelpful && feedbackGiven !== "helpful",
      active: feedbackGiven === "helpful",
    },
    {
      icon: <ThumbsDown size={14} />,
      label: "Not helpful",
      onClick: () => handleFeedback("not-helpful"),
      show: !!onNotHelpful && feedbackGiven !== "not-helpful",
      active: feedbackGiven === "not-helpful",
    },
  ].filter((action) => action.show);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`flex gap-2 ${isMobile ? "mt-3 justify-between" : "mt-2"}`}
        >
          {toolbarActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={action.onClick}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg transition-all"
              style={{
                background: action.active 
                  ? "rgba(212, 175, 55, 0.2)" 
                  : "var(--glass-bg)",
                color: action.active 
                  ? "var(--brand-primary)" 
                  : "var(--text-secondary)",
                border: action.active 
                  ? "1px solid rgba(212, 175, 55, 0.3)" 
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!action.active) {
                  e.currentTarget.style.background = "var(--glass-bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!action.active) {
                  e.currentTarget.style.background = "var(--glass-bg)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
              aria-label={action.label}
            >
              {action.icon}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
