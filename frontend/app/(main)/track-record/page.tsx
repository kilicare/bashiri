"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAITrackRecord, AITrackRecord } from "@/lib/api/predictions";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const MARKET_LABELS: Record<string, string> = {
  "1X2": "Matokeo ya Mechi", DOUBLE_CHANCE: "Double Chance", DRAW_NO_BET: "Draw No Bet",
  OVER_UNDER_0_5: "O/U 0.5", OVER_UNDER_1_5: "O/U 1.5", OVER_UNDER_2_5: "O/U 2.5",
  OVER_UNDER_3_5: "O/U 3.5", OVER_UNDER_4_5: "O/U 4.5", BTTS: "BTTS",
};

const LEAGUES = [
  { key: "", label: "Ligi Zote" }, { key: "EPL", label: "EPL" }, { key: "LaLiga", label: "La Liga" },
  { key: "Bundesliga", label: "Bundesliga" }, { key: "Ligue1", label: "Ligue 1" },
];

export default function AITrackRecordPage() {
  const router = useRouter();
  const [league, setLeague] = useState("");
  const [data, setData] = useState<AITrackRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotReady(false);
    getAITrackRecord(league || undefined)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setNotReady(true); setLoading(false); });
  }, [league]);

  return (
    <div>
      <div className="px-5 pt-safe pt-6 pb-4">
        <h1 className="text-2xl font-black text-white mb-1">Bashiri Track Record</h1>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
          Uwazi kamili — jinsi AI yetu ilivyofanya kwa mechi zote zilizopita.
        </p>
        <div className="flex gap-2 overflow-x-auto">
          {LEAGUES.map((l) => (
            <button
              key={l.key}
              onClick={() => setLeague(l.key)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
              style={{ background: league === l.key ? "var(--brand-accent)" : "rgba(255,255,255,0.06)", color: league === l.key ? "#000" : "rgba(255,255,255,0.5)" }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="px-4"><CardSkeleton /></div>
      ) : notReady || !data ? (
        <p className="text-center text-sm py-10 px-5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Takwimu bado hazijatengenezwa. Rudi baadaye leo au kesho.
        </p>
      ) : (
        <div className="px-5 space-y-6 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Usahihi kwa Kila Soko</p>
            <div className="space-y-2">
              {Object.entries(data.markets).map(([key, stat]) => (
                <div key={key} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-sm font-bold text-white">{MARKET_LABELS[key] || key}</p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.correct}/{stat.total} mechi</p>
                  </div>
                  <span className="text-lg font-black" style={{ color: stat.accuracy_percentage >= 50 ? "var(--success)" : "var(--warning)" }}>
                    {stat.accuracy_percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {data.weekly_trend.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Mwelekeo wa Wiki 8 za Mwisho (1X2)</p>
              <div className="rounded-2xl p-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data.weekly_trend}>
                    <XAxis dataKey="week_start" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} />
                    <Tooltip contentStyle={{ background: "#151515", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <Line type="monotone" dataKey="accuracy_percentage" stroke="var(--success)" strokeWidth={2} dot={{ fill: "var(--success)", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {data.boldest_calls.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>🔥 Chaguo za Ujasiri Zilizotokea</p>
              <div className="space-y-2">
                {data.boldest_calls.map((b, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(`/match/${b.match_id}/track-record`)}
                    className="w-full text-left rounded-2xl p-4"
                    style={{ background: "#111111", border: "1px solid rgba(34,197,94,0.15)" }}
                  >
                    <p className="text-sm font-bold text-white">{b.home_team} vs {b.away_team}</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      AI ilipiga <span style={{ color: "var(--brand-accent)" }}>{b.ai_predicted}</span> ikiwa na uhakika {b.ai_confidence}% pelee — na ikatokea kweli!
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Imetengenezwa: {new Date(data.generated_at).toLocaleString("sw-TZ")}
          </p>
        </div>
      )}
    </div>
  );
}
