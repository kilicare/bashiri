"use client";

import { MessageBubble } from "./MessageBubble";
import { MessageActions } from "./MessageActions";
import { AIResponseContainer } from "./AIResponseContainer";
import { ReactNode, useState, memo } from "react";
import { motion } from "framer-motion";

type MessageState = "thinking" | "generating" | "complete";

interface ResponseSection {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface AIMessageProps {
  content: string | ResponseSection[];
  timestamp?: string;
  state?: MessageState;
}

export const AIMessage = memo(function AIMessage({ content, timestamp, state = "complete" }: AIMessageProps) {
  const [showActions, setShowActions] = useState(false);

  const handleCopy = () => {
    const textContent = Array.isArray(content) 
      ? content.map(s => `${s.title}: ${typeof s.content === 'string' ? s.content : ''}`).join('\n')
      : content;
    navigator.clipboard.writeText(textContent);
  };

  const getStateMessage = () => {
    switch (state) {
      case "thinking":
        return "BASHIRI AI inachambua...";
      case "generating":
        return "Building match analysis...";
      default:
        return null;
    }
  };

  const stateMessage = getStateMessage();

  return (
    <MessageBubble isUser={false}>
      <div className="flex gap-3">
        {/* AI Avatar */}
        <div 
          className="w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{
            background: "var(--gradient-gold)",
            color: "#000",
          }}
        >
          B
        </div>

        {/* Message Content */}
        <div className="flex-1">
          <div
            className="rounded-3xl px-4 py-3 max-w-[85%] md:max-w-[70%] text-sm leading-relaxed relative group"
            style={{
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderBottomLeftRadius: "var(--radius-md)",
            }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            {stateMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--brand-primary)" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs">{stateMessage}</span>
              </motion.div>
            )}
            
            {!stateMessage && Array.isArray(content) ? (
              <AIResponseContainer sections={content} />
            ) : (
              !stateMessage && <div>{content as string}</div>
            )}
            
            {timestamp && state === "complete" && (
              <div 
                className="text-xs mt-2 opacity-50"
                style={{ color: "var(--text-secondary)" }}
              >
                {timestamp}
              </div>
            )}
          </div>
          <MessageActions show={showActions && state === "complete"} onCopy={handleCopy} />
        </div>
      </div>
    </MessageBubble>
  );
});
