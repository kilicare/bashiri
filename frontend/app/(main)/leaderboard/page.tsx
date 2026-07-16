"use client";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/api/feed";
import { CardSkeleton } from "@/components/ui/Skeleton";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [mode, setMode] = useState<"independent" | "all">("independent");
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("weekly");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(mode, period).then((data) => { setResults(data.results); setLoading(false); });
  }, [mode, period]);

  return (
    <div>
      <div className="px-5 pt-safe pt-6 pb-4">
        <h1 className="text-2xl font-black text-white mb-1">Top Predictors</h1>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          {mode === "independent"
            ? "Predictions za mtumiaji mwenyewe pekee — si zile zilizolingana na AI."
            : "Predictions zote, ikiwemo zilizolingana na AI Pick."}
        </p>

        <div className="flex gap-2 mb-2">
          {[{ v: "independent", l: "Ujuzi Wangu" }, { v: "all", l: "Predictions Zote" }].map((m) => (
            <button
              key={m.v}
              onClick={() => setMode(m.v as any)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: mode === m.v ? "#00FF87" : "rgba(255,255,255,0.06)", color: mode === m.v ? "#000" : "rgba(255,255,255,0.5)" }}
            >
              {m.l}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(["weekly", "monthly", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: period === p ? "#FFD600" : "rgba(255,255,255,0.06)", color: period === p ? "#000" : "rgba(255,255,255,0.5)" }}
            >
              {p === "weekly" ? "Wiki Hii" : p === "monthly" ? "Mwezi Huu" : "Wote"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => <CardSkeleton key={i} />)
        ) : results.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>
            Hakuna wa kutosha bado kwenye kipindi hiki. Fanya predictions zaidi ili uonekane hapa!
          </p>
        ) : (
          results.map((r) => (
            <div key={r.rank} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-lg w-8">{r.rank <= 3 ? MEDALS[r.rank - 1] : `#${r.rank}`}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">@{r.username}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{r.total_predictions} predictions • Streak {r.current_streak}🔥</p>
              </div>
              <span className="text-lg font-black" style={{ color: "#00FF87" }}>{r.accuracy_percentage}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}