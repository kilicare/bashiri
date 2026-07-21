"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export function PollCard({ cardId, data }: { cardId: number; data: any }) {
  const [tallies, setTallies] = useState(data.tallies || {});
  const [voted, setVoted] = useState(!!data.user_vote);
  const [error, setError] = useState("");
  const total = Object.values(tallies).reduce((a: number, b: any) => a + b, 0) as number;
  const { requireAuth } = useRequireAuth();

  // Update state when data changes (e.g., after refresh)
  useEffect(() => {
    console.log("PollCard data:", { cardId, data });
    console.log("PollCard tallies:", data.tallies);
    console.log("PollCard user_vote:", data.user_vote);
    console.log("Setting voted to:", !!data.user_vote);
    setTallies(data.tallies || {});
    setVoted(!!data.user_vote);
  }, [data.tallies, data.user_vote]);

  async function handleVote(choice: string) {
    if (voted) return;
    if (!requireAuth("Piga kura yako sasa — jisajili kwa dakika chache!")) return;
    setError("");
    try {
      const response = await apiClient(`/feed/polls/${cardId}/vote/`, { method: "POST", body: JSON.stringify({ choice }) });
      if (!response) {
        requireAuth("Piga kura yako sasa — jisajili kwa dakika chache!");
        return;
      }
      console.log("Vote response:", response);
      setTallies(response.tallies || data.tallies);
      setVoted(true);
    } catch (e: any) {
      // Show backend error message if available
      const errorMessage = e?.detail || e?.message || "Imeshindwa kupiga kura. Tafadhali jaribu tena.";
      setError(errorMessage);
      console.log("Vote error:", e);
      
      // If error says "Tayari umepiga kura", treat as voted and show bars
      if (errorMessage.includes("Tayari umepiga kura") || errorMessage.includes("already voted")) {
        setVoted(true);
        // Use data.tallies from feed if available
        if (data.tallies && Object.keys(data.tallies).length > 0) {
          setTallies(data.tallies);
        }
      }
    }
  }

  console.log("Render state:", { voted, tallies, total });

  return (
    <div className="rounded-3xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ 
      background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))", 
      border: "1px solid rgba(212,175,55,0.15)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
    }}>
      <span className="text-[10px] font-medium uppercase tracking-wider mb-3 block" style={{ color: "var(--warning)" }}>Poll</span>
      <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{data.question}</p>

      {error && (
        <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{error}</p>
      )}

      <div className="space-y-2">
        {data.options.map((opt: string) => {
          const count = tallies[opt] || 0;
          const pct = total > 0 ? count / total : 0;
          return (
            <button key={opt} onClick={() => handleVote(opt)} className="w-full text-left rounded-xl p-3 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--warning)] focus:ring-offset-2 focus:ring-offset-[var(--background)]" style={{ border: "1px solid var(--border)" }} disabled={voted}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "var(--text-primary)" }}>{opt}</span>
                {voted && <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{Math.round(pct * 100)}%</span>}
              </div>
              {voted && <ProgressBar value={pct} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}