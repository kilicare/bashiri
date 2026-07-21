"use client";

import { motion } from "framer-motion";
import { Circle, BarChart3, Brain, Check } from "lucide-react";

interface ThinkingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "analyzing" | "complete";
}

interface AIThinkingStateProps {
  steps?: ThinkingStep[];
  message?: string;
}

const DEFAULT_STEPS: ThinkingStep[] = [
  {
    id: "form",
    label: "Match form",
    icon: <Circle size={16} />,
    status: "complete",
  },
  {
    id: "stats",
    label: "Team statistics",
    icon: <BarChart3 size={16} />,
    status: "complete",
  },
  {
    id: "tactical",
    label: "Tactical analysis",
    icon: <Brain size={16} />,
    status: "analyzing",
  },
];

export function AIThinkingState({ steps = DEFAULT_STEPS, message }: AIThinkingStateProps) {
  return (
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

      {/* Thinking Content */}
      <div 
        className="flex-1 rounded-3xl rounded-bl-sm px-4 py-4 border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Message */}
        {message && (
          <div 
            className="text-sm font-medium mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            {message}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              {/* Icon Container */}
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 
                    step.status === "complete" 
                      ? "rgba(34, 197, 94, 0.1)" 
                      : step.status === "analyzing"
                      ? "rgba(212, 175, 55, 0.1)"
                      : "rgba(255, 255, 255, 0.05)",
                  color: 
                    step.status === "complete" 
                      ? "var(--success)" 
                      : step.status === "analyzing"
                      ? "var(--brand-primary)"
                      : "var(--text-muted)",
                }}
              >
                {step.status === "complete" ? (
                  <Check size={16} />
                ) : (
                  step.status === "analyzing" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      {step.icon}
                    </motion.div>
                  ) : (
                    step.icon
                  )
                )}
              </div>

              {/* Label */}
              <div 
                className="text-sm flex-1"
                style={{ 
                  color: step.status === "analyzing" ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: step.status === "analyzing" ? "500" : "400",
                }}
              >
                {step.label}
              </div>

              {/* Status Indicator */}
              {step.status === "analyzing" && (
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
              )}

              {step.status === "complete" && (
                <Check size={14} style={{ color: "var(--success)" }} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
