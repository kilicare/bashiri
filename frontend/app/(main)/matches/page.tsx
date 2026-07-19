"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFixtures, getLiveMatches, getFinishedMatches, searchMatches, Match } from "@/lib/api/predictions";
import { Search } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

function formatMatchDate(kickoffAt: string): string {
  const date = new Date(kickoffAt);
  return date.toLocaleDateString("sw-TZ", { 
    day: "numeric", 
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function MatchesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"fixtures" | "live" | "finished">("fixtures");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    if (tab === "fixtures") {
      getFixtures().then((data) => { setMatches(data); setLoading(false); });
    } else if (tab === "live") {
      getLiveMatches().then((data) => { setMatches(data); setLoading(false); });
    } else if (tab === "finished") {
      getFinishedMatches(20, 0).then((data) => {
        setMatches(data.results);
        setHasMore(data.count > 20);
        setLoading(false);
      });
    }
  }, [tab]);

  // Poll live matches every 15 seconds when on live tab
  useEffect(() => {
    if (tab !== "live") return;
    const interval = setInterval(() => {
      getLiveMatches().then((data) => { setMatches(data); });
    }, 15000);
    return () => clearInterval(interval);
  }, [tab]);

  async function loadMoreFinished() {
    const newOffset = offset + 20;
    const data = await getFinishedMatches(20, newOffset);
    setMatches((prev) => [...prev, ...data.results]);
    setOffset(newOffset);
    setHasMore(newOffset + 20 < data.count);
  }

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) return;
    const data = await searchMatches(q);
    setMatches(data.results);
  }

  return (
    <div>
      <div className="px-5 pt-safe pt-6 pb-3">
        <h1 className="text-2xl font-black text-white mb-4">Matches</h1>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4" style={{ background: "#151515" }}>
          <Search size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          <input
            className="bg-transparent outline-none text-sm text-white flex-1"
            placeholder="Tafuta timu au mechi..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["fixtures", "live", "finished"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-full text-sm font-bold"
              style={{
                background: tab === t ? "var(--brand-accent)" : "rgba(255,255,255,0.06)",
                color: tab === t ? "#000" : "rgba(255,255,255,0.5)",
              }}
            >
              {t === "fixtures" ? "Fixtures" : t === "live" ? "Live" : "Finished"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => <CardSkeleton key={i} />)
          ) : matches.length === 0 ? (
            <p className="col-span-full text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna mechi kwa sasa.</p>
          ) : (
            matches.map((m, index) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard hover className="p-4">
                  <button
                    onClick={() => router.push(`/create/${m.id}/overview`)}
                    className="w-full text-left"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.22em] mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {m.league.name}
                          </p>
                          <p className="text-base font-black text-white truncate">
                            {m.home_team.name} vs {m.away_team.name}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {m.status === "LIVE" ? (
                            <span className="text-sm font-black" style={{ color: "var(--success)" }}>{m.home_score}-{m.away_score}</span>
                          ) : m.status === "FINISHED" ? (
                            <span className="text-sm font-black text-white">{m.home_score}-{m.away_score}</span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(207,175,123,0.14)", color: "var(--brand-accent)" }}>
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <span className="bg-white/5 rounded-full px-2 py-1">{formatMatchDate(m.kickoff_at)}</span>
                        {m.matchday && <span className="bg-white/5 rounded-full px-2 py-1">Matchday {m.matchday}</span>}
                      </div>

                      {(m.stage_display || m.group_name) && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {m.stage_display && (
                            <span className="px-2 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)" }}>
                              {m.stage_display}
                            </span>
                          )}
                          {m.group_name && (
                            <span className="px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }}>
                              {m.group_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
        {tab === "finished" && hasMore && !loading && (
          <button
            onClick={loadMoreFinished}
            className="w-full py-3 text-sm font-bold rounded-2xl mt-4"
            style={{ color: "var(--brand-accent)", background: "rgba(207,175,123,0.06)" }}
          >
            Pakia Zaidi
          </button>
        )}
      </div>
    </div>
  );
}