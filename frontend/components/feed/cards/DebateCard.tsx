"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flame } from "lucide-react";

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
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const countdown = useCountdown(data.closes_at);
  const total = Object.values(tallies).reduce((a: number, b: any) => a + b, 0) as number;
  const isClosed = data.is_closed || data.voting_closed;

  // Check if user already voted
  useEffect(() => {
    async function checkVote() {
      try {
        await apiClient(`/feed/debates/${cardId}/vote/`, { method: "GET" });
        setVoted(true);
      } catch {
        setVoted(false);
      }
      setLoading(false);
    }
    checkVote();
  }, [cardId]);

  async function handleVote(choice: string) {
    if (voted || isClosed) return;
    try {
      await apiClient(`/feed/debates/${cardId}/vote/`, { method: "POST", body: JSON.stringify({ choice }) });
      setTallies((prev: any) => ({ ...prev, [choice]: (prev[choice] || 0) + 1 }));
      setVoted(true);
    } catch {}
  }

  return (
    <div className="rounded-3xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,71,87,0.2)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Flame size={14} style={{ color: "#FF4757" }} />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#FF4757" }}>Debate</span>
        {!isClosed && <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Closes in {countdown}</span>}
      </div>

      <p className="text-base font-bold text-white mb-4">{data.question}</p>

      <div className="space-y-2">
        {data.options.map((opt: string) => {
          const count = tallies[opt] || 0;
          const pct = total > 0 ? count / total : 0;
          const isResult = data.is_closed && data.result === opt;
          return (
            <button key={opt} onClick={() => handleVote(opt)} className="w-full text-left" disabled={voted || isClosed || loading}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: isResult ? "#00FF87" : "#fff" }}>
                  {opt} {isResult && "✅"}
                </span>
                {(voted || isClosed) && <span className="text-xs font-bold" style={{ color: "#FF4757" }}>{Math.round(pct * 100)}%</span>}
              </div>
              {(voted || isClosed) && <ProgressBar value={pct} color="#FF4757" />}
            </button>
          );
        })}
      </div>

      {data.is_closed && (
        <p className="text-xs mt-4 text-center font-bold" style={{ color: "#00FF87" }}>🏁 Debate Closed — Result: {data.result}</p>
      )}
    </div>
  );
}
