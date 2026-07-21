"use client";

import { MessageBubble } from "./MessageBubble";
import { MessageActions } from "./MessageActions";
import { useState, memo } from "react";

interface UserMessageProps {
  content: string;
  timestamp?: string;
}

export const UserMessage = memo(function UserMessage({ content, timestamp }: UserMessageProps) {
  const [showActions, setShowActions] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <MessageBubble isUser={true}>
      <div
        className="rounded-3xl px-4 py-3 max-w-[85%] md:max-w-[70%] text-sm leading-relaxed relative group"
        style={{
          background: "var(--gradient-gold)",
          color: "#000",
          borderBottomRightRadius: "var(--radius-md)",
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {content}
        {timestamp && (
          <div 
            className="text-xs mt-1 opacity-70"
            style={{ color: "#000" }}
          >
            {timestamp}
          </div>
        )}
      </div>
      <MessageActions show={showActions} onCopy={handleCopy} />
    </MessageBubble>
  );
});
