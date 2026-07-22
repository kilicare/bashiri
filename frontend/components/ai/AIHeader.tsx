"use client";

import { Trophy, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface AIHeaderProps {
  remaining: number | null;
}

export function AIHeader({ remaining }: AIHeaderProps) {
  const router = useRouter();

  return (
    <div 
      className="flex items-center gap-3"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: '16px',
        paddingLeft: '16px',
        paddingRight: '20px',
        borderBottom: "1px solid var(--border)",
        background: "var(--background)",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--surface-alt)";
          e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--surface)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
        aria-label="Go back"
      >
        <ArrowLeft size={20} style={{ color: "var(--text-primary)" }} />
      </button>

      {/* AI Identity - Football Icon */}
      <div 
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: "var(--gradient-gold)",
          boxShadow: "0 2px 8px rgba(212, 175, 55, 0.25)",
        }}
      >
        <Trophy size={22} style={{ color: "#000" }} />
      </div>

      {/* Title Section */}
      <div className="flex-1 min-w-0">
        <h1 
          className="text-lg font-semibold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Bashiri AI
        </h1>
        <p 
          className="text-xs font-medium mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Football Prediction Intelligence
        </p>
      </div>

      {/* Remaining Count Badge */}
      {remaining !== null && (
        <div 
          className="px-3 py-1.5 rounded-xl flex-shrink-0"
          style={{
            background: "rgba(212, 175, 55, 0.08)",
            border: "1px solid rgba(212, 175, 55, 0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <span 
            className="text-xs font-semibold"
            style={{ color: "var(--brand-primary)" }}
          >
            {remaining} left
          </span>
        </div>
      )}
    </div>
  );
}
