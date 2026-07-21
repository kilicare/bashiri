"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ResponseSection {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface AIResponseContainerProps {
  sections: ResponseSection[];
  children?: ReactNode;
}

export function AIResponseContainer({ sections, children }: AIResponseContainerProps) {
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.1 }}
        >
          {section.icon && (
            <div className="flex items-center gap-2 mb-3">
              {section.icon}
              <h4 
                className="font-bold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {section.title}
              </h4>
            </div>
          )}
          {!section.icon && (
            <h4 
              className="font-bold text-sm mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              {section.title}
            </h4>
          )}
          {section.content}
        </motion.div>
      ))}
      
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: sections.length * 0.1 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
