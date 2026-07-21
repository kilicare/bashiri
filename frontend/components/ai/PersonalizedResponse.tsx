"use client";

import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { AIMessage } from "./AIMessage";

interface PersonalizedContext {
  userProfile?: {
    analysisStyle?: "detailed" | "concise" | "balanced";
    riskPreference?: "conservative" | "balanced" | "aggressive";
    favoriteLeague?: string;
  };
  conversationContext?: {
    currentMatch?: string;
    previousTopics?: string[];
    userIntent?: string;
  };
}

interface PersonalizedResponseProps {
  content: string;
  context?: PersonalizedContext;
  timestamp?: string;
}

export function PersonalizedResponse({ content, context, timestamp }: PersonalizedResponseProps) {
  const getPersonalizationBadge = () => {
    if (!context) return null;

    const badges = [];

    if (context.userProfile?.analysisStyle) {
      badges.push({
        label: context.userProfile.analysisStyle,
        icon: <Sparkles size={12} />,
      });
    }

    if (context.userProfile?.riskPreference) {
      badges.push({
        label: context.userProfile.riskPreference,
        icon: <User size={12} />,
      });
    }

    if (badges.length === 0) return null;

    return (
      <div className="flex gap-2 mb-3">
        {badges.map((badge, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{
              background: "rgba(212, 175, 55, 0.1)",
              color: "var(--brand-primary)",
            }}
          >
            {badge.icon}
            <span className="capitalize">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  const badge = getPersonalizationBadge();
  
  // Combine badge with content if present
  const enhancedContent = badge ? (
    <div>
      {badge}
      <div>{content}</div>
    </div>
  ) : content;

  return (
    <AIMessage content={enhancedContent as string} timestamp={timestamp} />
  );
}
