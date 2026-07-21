"use client";

import { Sparkles } from "lucide-react";

interface AIHeaderProps {
  remaining: number | null;
}

export function AIHeader({ remaining }: AIHeaderProps) {
  return (
    <div className="px-5 pt-safe pt-6 pb-4 flex items-center gap-3 border-b border-[var(--border)]">
      {/* AI Identity */}
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: "var(--gradient-gold)",
        }}
      >
        <Sparkles size={20} style={{ color: "#000" }} />
      </div>

      {/* Title Section */}
      <div className="flex-1">
        <h1 
          className="text-xl font-black"
          style={{ color: "var(--text-primary)" }}
        >
          Bashiri AI
        </h1>
        <p 
          className="text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          Mtaalamu wa mechi za soka
        </p>
      </div>

      {/* Remaining Count Badge */}
      {remaining !== null && (
        <div 
          className="px-3 py-1.5 rounded-xl border"
          style={{
            background: "rgba(212, 175, 55, 0.1)",
            borderColor: "rgba(212, 175, 55, 0.3)",
          }}
        >
          <span 
            className="text-xs font-bold"
            style={{ color: "var(--brand-primary)" }}
          >
            {remaining} yamebaki
          </span>
        </div>
      )}
    </div>
  );
}
