"use client";

import { motion } from "framer-motion";
import { Trophy, BarChart3, Target, Flame, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

interface QuickActionCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
  description: string;
}

interface SuggestionCategory {
  icon: React.ReactNode;
  title: string;
  description: string;
  suggestions: string[];
}

const QUICK_ACTIONS: QuickActionCard[] = [
  {
    id: "predict",
    title: "Fanya Prediction",
    icon: <Trophy size={24} style={{ color: "var(--brand-primary)" }} />,
    route: "/create",
    description: "Pata prediction ya mechi",
  },
  {
    id: "track-record",
    title: "Track Record",
    icon: <BarChart3 size={24} style={{ color: "var(--brand-accent)" }} />,
    route: "/track-record",
    description: "Ona utendaji wa AI",
  },
  {
    id: "derby",
    title: "Derby Hub",
    icon: <Flame size={24} style={{ color: "var(--warning)" }} />,
    route: "/derby",
    description: "Mechi za Derby",
  },
  {
    id: "pulse",
    title: "Bashiri Pulse",
    icon: <Zap size={24} style={{ color: "var(--info)" }} />,
    route: "/pulse",
    description: "Habari za soka",
  },
];

const CATEGORIES: SuggestionCategory[] = [
  {
    icon: <Trophy size={20} style={{ color: "var(--brand-primary)" }} />,
    title: "Match Predictions",
    description: "Get AI-powered match predictions",
    suggestions: [
      "Nani atashinda mechi kubwa ya leo?",
      "Onesha AI Track Record ya wiki hii",
      "Kuna Derby wiki hii?",
      "Simba wamekuwaje msimu huu?",
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
];

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
      {/* Animated Icon */}
      <motion.div
        className="text-6xl mb-5"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ⚽
      </motion.div>

      {/* Title */}
      <h2 
        className="text-xl font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Bashiri AI
      </h2>

      {/* Subtitle */}
      <p 
        className="text-sm mb-6 max-w-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        Your premium football intelligence companion
      </p>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl w-full mb-6">
        {QUICK_ACTIONS.map((action, index) => (
          <motion.button
            key={action.id}
            onClick={() => router.push(action.route)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl p-4 border text-left transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.3)";
              e.currentTarget.style.background = "var(--surface-alt)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--surface)";
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2">{action.icon}</div>
              <div 
                className="font-semibold text-sm mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {action.title}
              </div>
              <div 
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {action.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Suggested Questions */}
      <div className="w-full max-w-lg">
        <h3 
          className="font-semibold text-sm mb-3 text-center"
          style={{ color: "var(--text-primary)" }}
        >
            Maswali Yanayopendekezwa
        </h3>
        <div className="grid grid-cols-1 gap-3">
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
                className="font-semibold text-sm"
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
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-all"
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
    </div>
  );
}
