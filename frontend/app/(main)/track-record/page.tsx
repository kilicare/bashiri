"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAITrackRecord, AITrackRecord, League } from "@/lib/api/predictions";
import { getLeagues } from "@/lib/api/settings";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { shouldReduceMotion, getAnimationDuration, getAnimationEasing } from "@/utils/animation";
import { useMobileTooltip } from "@/hooks/useMobileTooltip";

const MARKET_LABELS: Record<string, string> = {
  "1X2": "Matokeo ya Mechi", DOUBLE_CHANCE: "Double Chance", DRAW_NO_BET: "Draw No Bet",
  OVER_UNDER_0_5: "O/U 0.5", OVER_UNDER_1_5: "O/U 1.5", OVER_UNDER_2_5: "O/U 2.5",
  OVER_UNDER_3_5: "O/U 3.5", OVER_UNDER_4_5: "O/U 4.5", BTTS: "BTTS",
};

export default function AITrackRecordPage() {
  const router = useRouter();
  const [league, setLeague] = useState("");
  const [data, setData] = useState<AITrackRecord | null>(null);
  const [leagues, setLeagues] = useState<{ key: string; label: string }[]>([
    { key: "", label: "Ligi Zote" }
  ]);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState(false);
  const { tooltip, handleChartClick, hideTooltip } = useMobileTooltip();

  useEffect(() => {
    // Load available leagues dynamically from backend
    getLeagues().then((leagueData: League[]) => {
      const leagueOptions = leagueData.map((l) => ({
        key: l.poisson_key,
        label: l.name
      }));
      setLeagues([{ key: "", label: "Ligi Zote" }, ...leagueOptions]);
    }).catch(() => {
      // Fallback to hardcoded leagues if API fails
      setLeagues([
        { key: "", label: "Ligi Zote" },
        { key: "EPL", label: "EPL" },
        { key: "LaLiga", label: "La Liga" },
        { key: "Bundesliga", label: "Bundesliga" },
        { key: "Ligue1", label: "Ligue 1" },
        { key: "Serie A", label: "Serie A" },
        { key: "Championship", label: "Championship" },
        { key: "UEFA Champions League", label: "UEFA Champions League" },
        { key: "Campeonato Brasileiro Série A", label: "Campeonato Brasileiro Série A" }
      ]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setNotReady(false);
    getAITrackRecord(league || undefined)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setNotReady(true); setLoading(false); });
  }, [league]);

  return (
    <div>
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white">Bashiri Track Record</h1>
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
          Uwazi kamili — jinsi AI yetu ilivyofanya kwa mechi zote zilizopita.
        </p>
        <div className="flex gap-2 overflow-x-auto">
          {leagues.map((l: { key: string; label: string }) => (
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
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: "var(--brand-primary)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Mwelekeo wa Wiki 8 za Mwisho (1X2)</p>
              </div>
              <div
                className="rounded-2xl p-4 cursor-pointer relative chart-glass"
                onClick={(e) => handleChartClick(e, { accuracy_percentage: data.weekly_trend[data.weekly_trend.length - 1]?.accuracy_percentage })}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart
                    data={data.weekly_trend}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={true}
                      horizontal={true}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="week_start"
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(17, 17, 17, 0.95)",
                        border: "1px solid rgba(212, 175, 55, 0.2)",
                        borderRadius: "8px",
                        padding: "12px",
                        fontSize: "12px"
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                      formatter={(value: any) => [`${value.toFixed(1)}%`, 'Usahihi']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('sw-TZ', { weekday: 'long', day: 'numeric', month: 'short' })}
                    />
                    <Area
                      type="monotone"
                      dataKey="accuracy_percentage"
                      stroke="var(--brand-primary)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#accuracyGradient)"
                      dot={{ fill: "var(--brand-primary)", r: 4, strokeWidth: 2, stroke: "#111111" }}
                      activeDot={{ r: 6, stroke: "var(--brand-accent)", strokeWidth: 2 }}
                      isAnimationActive={!shouldReduceMotion()}
                      animationDuration={getAnimationDuration(800)}
                      animationEasing={getAnimationEasing('ease-in-out')}
                      animationBegin={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Mobile Tooltip */}
                {tooltip.visible && (
                  <div
                    className="fixed bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm z-50 pointer-events-none border border-white/10"
                    style={{
                      left: `${tooltip.x}px`,
                      top: `${tooltip.y - 40}px`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {tooltip.content}
                  </div>
                )}
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
