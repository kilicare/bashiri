"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFixtures, Match } from "@/lib/api/predictions";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function CreatePredictionStep1() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFixtures().then((data) => { setMatches(data); setLoading(false); });
  }, []);

  const grouped = matches.reduce((acc: Record<string, Match[]>, m) => {
    const key = m.league.name;
    acc[key] = acc[key] || [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div>
      <div className="px-5 pt-safe pt-6 pb-4">
        <h1 className="text-2xl font-black text-white">Chagua Mechi</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Anza prediction yako ya AI</p>
      </div>
      <div className="px-4 md:px-6 lg:px-8 space-y-5">
        {loading ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : (
          Object.entries(grouped).map(([league, leagueMatches]) => (
            <div key={league}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{league}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {leagueMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => router.push(`/create/${m.id}/overview`)}
                    className="w-full rounded-2xl p-4 flex items-center justify-between"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-sm font-bold text-white">{m.home_team.name} vs {m.away_team.name}</p>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {new Date(m.kickoff_at).toLocaleDateString("sw-TZ", { day: "numeric", month: "short" })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}