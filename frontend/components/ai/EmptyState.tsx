"use client";

import { motion } from "framer-motion";
import { Trophy, BarChart3, Target, Circle, Camera, Image as ImageIcon } from "lucide-react";

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

interface SuggestionCategory {
  icon: React.ReactNode;
  title: string;
  description: string;
  suggestions: string[];
}

const CATEGORIES: SuggestionCategory[] = [
  {
    icon: <Trophy size={20} style={{ color: "var(--brand-primary)" }} />,
    title: "Match Predictions",
    description: "Get AI-powered match predictions",
    suggestions: [
      "Who will win Man City vs Arsenal?",
      "Predict Chelsea vs Liverpool",
      "Analyze Tottenham vs Everton",
    ],
  },
  {
    icon: <Camera size={20} style={{ color: "var(--brand-accent)" }} />,
    title: "Analyze Screenshot",
    description: "Upload betting slips or lineups",
    suggestions: [
      "Upload betting slip for analysis",
      "Analyze match lineup screenshot",
      "Review odds from screenshot",
    ],
  },
  {
    icon: <BarChart3 size={20} style={{ color: "var(--warning)" }} />,
    title: "Team Analysis",
    description: "Deep dive into team performance",
    suggestions: [
      "Analyze Manchester United's form",
      "Compare Arsenal and Liverpool",
      "Evaluate Tottenham's defense",
    ],
  },
  {
    icon: <Target size={20} style={{ color: "var(--info)" }} />,
    title: "Betting Strategy",
    description: "Smart betting insights",
    suggestions: [
      "Safest predictions today",
      "High-risk high-reward matches",
      "Value betting opportunities",
    ],
  },
];

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
      {/* Animated Icon */}
      <motion.div
        className="text-6xl mb-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ⚽
      </motion.div>

      {/* Title */}
      <h2 
        className="text-2xl font-black mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Bashiri AI
      </h2>

      {/* Subtitle */}
      <p 
        className="text-sm mb-8 max-w-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        Your premium football intelligence companion
      </p>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
        {CATEGORIES.map((category, categoryIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="rounded-2xl p-4 border text-left"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3">
              {category.icon}
              <h3 
                className="font-bold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {category.title}
              </h3>
            </div>

            {/* Category Description */}
            <p 
              className="text-xs mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {category.description}
            </p>

            {/* Category Suggestions */}
            <div className="space-y-2">
              {category.suggestions.map((suggestion, suggestionIndex) => (
                <motion.button
                  key={suggestion}
                  onClick={() => onSuggestionClick(suggestion)}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: categoryIndex * 0.1 + suggestionIndex * 0.05 }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                  style={{
                    background: "var(--surface-alt)",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.3)";
                    e.currentTarget.style.background = "var(--surface)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--surface-alt)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
