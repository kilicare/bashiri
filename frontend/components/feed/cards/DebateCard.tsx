"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flame } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { motion } from "framer-motion";

function useCountdown(target: string) {
  const [text, setText] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setText("Imefungwa"); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      setText(`${days}d ${hours}h`);
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);
  return text;
}

export function DebateCard({ cardId, data }: { cardId: number; data: any }) {
  const [tallies, setTallies] = useState(data.tallies || {});
  const [voted, setVoted] = useState(!!data.user_vote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const countdown = useCountdown(data.closes_at);
  const total = Object.values(tallies).reduce((a: number, b: any) => a + b, 0) as number;
  const isClosed = data.is_closed || data.voting_closed;
  const { requireAuth } = useRequireAuth();

  async function handleVote(choice: string) {
    if (voted || isClosed) return;
    if (!requireAuth("Piga kura yako sasa — jisajili kwa dakika chache!")) return;
    setError("");
    try {
      const response = await apiClient(`/feed/debates/${cardId}/vote/`, { method: "POST", body: JSON.stringify({ choice }) });
      if (!response) {
        requireAuth("Piga kura yako sasa — jisajili kwa dakika chache!");
        return;
      }
      setTallies(response.tallies || data.tallies);
      setVoted(true);
    } catch (e: any) {
      // If user already voted, show results instead of error
      if (e.message && e.message.includes("Tayari umeshiriki")) {
        setVoted(true);
        // Use existing tallies from initial data
      } else {
        setError(e.message || "Imeshindwa kupiga kura. Tafadhali jaribu tena.");
      }
    }
  }

  return (
    <div className="rounded-3xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ 
      background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04), var(--surface))", 
      border: "1px solid rgba(212,175,55,0.15)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
    }}>
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          <Flame size={14} style={{ color: "var(--brand-accent)" }} />
        </motion.div>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--brand-accent)" }}>Debate</span>
        {!isClosed && <span className="ml-auto text-[10px]" style={{ color: "var(--text-secondary)" }}>Closes in {countdown}</span>}
      </div>

      <p className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{data.question}</p>

      {error && (
        <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{error}</p>
      )}

      <div className="space-y-2">
        {data.options.map((opt: string, idx: number) => {
          const count = tallies[opt] || 0;
          const pct = total > 0 ? count / total : 0;
          const isResult = data.is_closed && data.result === opt;
          const showResults = voted || isClosed;
          
          // Different hover colors for each option
          const hoverColors = [
            "rgba(239, 68, 68, 0.08)",  // Danger for first option
            "rgba(212, 175, 55, 0.08)",  // Brand accent for second option
            "rgba(245, 158, 11, 0.08)",  // Warning for third option
          ];
          const hoverColor = hoverColors[idx % hoverColors.length];
          
          return (
            <button 
              key={opt} 
              onClick={() => handleVote(opt)} 
              className="w-full text-left rounded-xl p-3 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
              style={{ 
                background: "transparent",
                border: "1px solid var(--border)",
                opacity: (voted || isClosed) ? 0.7 : 1,
                cursor: (voted || isClosed) ? "not-allowed" : "pointer"
              }}
              disabled={voted || isClosed || loading}
              onMouseEnter={(e) => {
                if (!(voted || isClosed)) {
                  e.currentTarget.style.background = hoverColor;
                  e.currentTarget.style.borderColor = hoverColor.replace("0.08", "0.18");
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: isResult ? "var(--success)" : "var(--text-primary)" }}>
                  {opt} {isResult && "✅"}
                </span>
                {showResults && total > 0 && <span className="text-xs font-medium" style={{ color: "var(--brand-accent)" }}>{Math.round(pct * 100)}%</span>}
              </div>
              {showResults && total > 0 && <ProgressBar value={pct} color="var(--brand-accent)" />}
            </button>
          );
        })}
      </div>

      {voted && !isClosed && (
        <p className="text-xs mt-4 text-center font-medium" style={{ color: "var(--success)" }}>✓ Umeshiriki kwenye debate hii</p>
      )}
      {data.is_closed && (
        <p className="text-xs mt-4 text-center font-medium" style={{ color: "var(--success)" }}>🏁 Debate Closed — Result: {data.result}</p>
      )}
    </div>
  );
}
