"use client";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/api/feed";
import { CardSkeleton } from "@/components/ui/Skeleton";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("all");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period).then((data) => { setResults(data.results); setLoading(false); });
  }, [period]);

  return (
    <div>
      <div className="px-5 pt-safe pt-6 pb-4">
        <h1 className="text-2xl font-black text-white mb-4">Top Predictors</h1>
        <div className="flex gap-2">
          {(["weekly", "monthly", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: period === p ? "#00FF87" : "rgba(255,255,255,0.06)", color: period === p ? "#000" : "rgba(255,255,255,0.5)" }}
            >
              {p === "weekly" ? "Wiki" : p === "monthly" ? "Mwezi" : "Wote"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        {loading ? [1, 2, 3].map((i) => <CardSkeleton key={i} />) : results.map((r) => (
          <div key={r.rank} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-lg w-8">{r.rank <= 3 ? MEDALS[r.rank - 1] : `#${r.rank}`}</span>
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              {r.avatar_url ? (
                <img src={r.avatar_url} alt={r.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">{r.username?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">@{r.username}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{r.total_predictions} predictions • Streak {r.current_streak}🔥</p>
            </div>
            <span className="text-lg font-black" style={{ color: "#00FF87" }}>{r.accuracy_percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}