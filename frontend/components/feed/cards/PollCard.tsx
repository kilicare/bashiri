"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export function PollCard({ cardId, data }: { cardId: number; data: any }) {
  const [tallies, setTallies] = useState(data.tallies || {});
  const [voted, setVoted] = useState(!!data.user_vote);
  const [error, setError] = useState("");
  const total = Object.values(tallies).reduce((a: number, b: any) => a + b, 0) as number;
  const { requireAuth } = useRequireAuth();

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
      setTallies(response.tallies || data.tallies);
      setVoted(true);
    } catch (e: any) {
      setError(e.message || "Imeshindwa kupiga kura. Tafadhali jaribu tena.");
    }
  }

  return (
    <div className="rounded-3xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span className="text-[10px] font-black uppercase tracking-widest mb-3 block" style={{ color: "#FFD600" }}>Poll</span>
      <p className="text-sm font-bold text-white mb-4">{data.question}</p>

      {error && (
        <p className="text-xs mb-3" style={{ color: "#FF4757" }}>{error}</p>
      )}

      <div className="space-y-2">
        {data.options.map((opt: string) => {
          const count = tallies[opt] || 0;
          const pct = total > 0 ? count / total : 0;
          return (
            <button key={opt} onClick={() => handleVote(opt)} className="w-full text-left" disabled={voted}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white">{opt}</span>
                {voted && <span className="text-xs font-bold" style={{ color: "#00FF87" }}>{Math.round(pct * 100)}%</span>}
              </div>
              {voted && <ProgressBar value={pct} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}