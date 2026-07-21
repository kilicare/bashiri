"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MessageBubbleProps {
  children: ReactNode;
  className?: string;
  isUser?: boolean;
}

export function MessageBubble({ children, className = "", isUser = false }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut" 
      }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} ${className}`}
    >
      {children}
    </motion.div>
  );
}
