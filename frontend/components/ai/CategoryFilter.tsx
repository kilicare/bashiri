"use client";

import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { ConversationCategory } from "./ConversationTypes";

interface CategoryFilterProps {
  selectedCategory: ConversationCategory | "all";
  onSelectCategory: (category: ConversationCategory | "all") => void;
}

const CATEGORIES: Array<{ id: ConversationCategory | "all"; label: string; icon: string; color: string }> = [
  { id: "all", label: "All", icon: "💬", color: "var(--text-secondary)" },
  { id: "match-analysis", label: "Match Analysis", icon: "⚽", color: "var(--brand-primary)" },
  { id: "betting", label: "Betting", icon: "🎯", color: "var(--brand-accent)" },
  { id: "statistics", label: "Statistics", icon: "📊", color: "var(--info)" },
  { id: "news", label: "News", icon: "🔥", color: "var(--warning)" },
  { id: "general", label: "General", icon: "💬", color: "var(--text-secondary)" },
];

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter size={16} style={{ color: "var(--text-secondary)" }} />
        <span 
          className="text-xs font-bold"
          style={{ color: "var(--text-secondary)" }}
        >
          Filter by Category
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <motion.button
            key={category.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(category.id)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              selectedCategory === category.id ? "border-2" : "border"
            }`}
            style={{
              background: selectedCategory === category.id 
                ? `${category.color}20` 
                : "var(--surface)",
              borderColor: selectedCategory === category.id 
                ? category.color 
                : "var(--border)",
              color: selectedCategory === category.id 
                ? category.color 
                : "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              if (selectedCategory !== category.id) {
                e.currentTarget.style.background = "var(--surface-alt)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCategory !== category.id) {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
