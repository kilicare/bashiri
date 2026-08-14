"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface StreamingTextProps {
  text: string;
  speed?: number; // characters per second
  onComplete?: () => void;
  isComplete?: boolean;
}

export function StreamingText({ 
  text, 
  speed = 30, 
  onComplete,
  isComplete = false 
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setDisplayedText(text);
      setIsStreaming(false);
      return;
    }

    if (!text) {
      setDisplayedText("");
      return;
    }

    setIsStreaming(true);
    setDisplayedText("");

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        onComplete?.();
      }
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [text, speed, isComplete, onComplete]);

  return (
    <span className="break-words overflow-wrap-anywhere">
      {displayedText}
      {isStreaming && (
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-2 h-4 ml-1 flex-shrink-0"
          style={{ background: "var(--brand-primary)" }}
        />
      )}
    </span>
  );
}
