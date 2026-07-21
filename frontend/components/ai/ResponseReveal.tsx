"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RevealSection {
  id: string;
  content: ReactNode;
  priority?: number; // Lower number = appears first
}

interface ResponseRevealProps {
  sections: RevealSection[];
  onComplete?: () => void;
}

export function ResponseReveal({ sections, onComplete }: ResponseRevealProps) {
  // Sort sections by priority
  const sortedSections = [...sections].sort((a, b) => 
    (a.priority || 0) - (b.priority || 0)
  );

  return (
    <div className="space-y-4">
      {sortedSections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: "easeOut",
            delay: index * 0.15, // Stagger effect
          }}
          onAnimationComplete={() => {
            if (index === sortedSections.length - 1) {
              onComplete?.();
            }
          }}
        >
          {section.content}
        </motion.div>
      ))}
    </div>
  );
}
