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
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <h1 className="text-2xl font-black text-white">Chagua Mechi</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Anza prediction yako ya AI</p>
      </div>
      <div className="px-4 md:px-6 lg:px-8 space-y-5">
        {loading ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-dvh text-center pt-20">
            <div className="text-6xl mb-4">🏟️</div>
            <p className="text-xl font-bold text-white mb-2">Hakuna Mechi Leo</p>
            <p className="text-sm text-white/60 max-w-xs">
              Kwa sasa hakuna mechi zinazopatikana kwa prediction. Rudi baadaye uone mechi zinazovuma!
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([league, leagueMatches]) => (
            <div key={league}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{league}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {leagueMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => router.push(`/create/${m.id}/overview`)}
                    className="w-full rounded-2xl p-4 flex flex-col items-start gap-2"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <p className="text-sm font-bold text-white">{m.home_team.name} vs {m.away_team.name}</p>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {new Date(m.kickoff_at).toLocaleDateString("sw-TZ", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {m.stage_display && (
                      <span className="text-xs rounded-full px-2 py-1" style={{ background: "rgba(255,214,0,0.08)", color: "#FFD600" }}>
                        {m.stage_display}{m.group_name ? ` • ${m.group_name}` : ""}
                      </span>
                    )}
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