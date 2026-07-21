"use client";

import { motion } from "framer-motion";
import { MessageSquare, Plus } from "lucide-react";

interface EmptyConversationsProps {
  onCreateConversation: () => void;
}

export function EmptyConversations({ onCreateConversation }: EmptyConversationsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
      {/* Animated Icon */}
      <motion.div
        className="text-6xl mb-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        💬
      </motion.div>

      {/* Title */}
      <h2 
        className="text-xl font-bold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        No Conversations Yet
      </h2>

      {/* Subtitle */}
      <p 
        className="text-sm mb-6 max-w-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        Start a new conversation with BASHIRI AI to get personalized football intelligence
      </p>

      {/* CTA Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onCreateConversation}
        className="px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2"
        style={{
          background: "var(--gradient-gold)",
          color: "#000",
        }}
      >
        <Plus size={16} />
        <span>New Chat</span>
      </motion.button>

      {/* Tips */}
      <div 
        className="mt-8 p-4 rounded-xl max-w-sm"
        style={{ background: "var(--surface-alt)" }}
      >
        <div 
          className="text-xs font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Tips:
        </div>
        <ul 
          className="text-xs text-left space-y-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <li>• Ask about match predictions</li>
          <li>• Analyze team performance</li>
          <li>• Get betting insights</li>
          <li>• Upload screenshots for analysis</li>
        </ul>
      </div>
    </div>
  );
}
