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
                background: tab === t ? "#00FF87" : "rgba(255,255,255,0.06)",
                color: tab === t ? "#000" : "rgba(255,255,255,0.5)",
              }}
            >
              {t === "fixtures" ? "Fixtures" : t === "live" ? "Live" : "Finished"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    className="w-full"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-left flex-1">
                        <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {m.league.name}
                        </p>
                        <p className="text-sm font-bold text-white">{m.home_team.name} vs {m.away_team.name}</p>
                      </div>
                      {m.status === "LIVE" ? (
                        <span className="text-sm font-black ml-2" style={{ color: "#00FF87" }}>{m.home_score}-{m.away_score}</span>
                      ) : m.status === "FINISHED" ? (
                        <span className="text-sm font-black ml-2 text-white">{m.home_score}-{m.away_score}</span>
                      ) : null}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      <div className="flex items-center gap-2">
                        <span>📅 {formatMatchDate(m.kickoff_at)}</span>
                        {m.matchday && <span>• Matchday {m.matchday}</span>}
                      </div>
                      {m.status === "SCHEDULED" && (
                        <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,135,0.1)", color: "#00FF87" }}>
                          Upcoming
                        </span>
                      )}
                    </div>

                    {(m.stage_display || m.group_name) && (
                      <div className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {m.stage_display && (
                          <span className="px-1.5 py-0.5 rounded-full mr-1" style={{ background: "rgba(255,214,0,0.1)", color: "#FFD600" }}>
                            {m.stage_display}
                          </span>
                        )}
                        {m.group_name && (
                          <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                            {m.group_name}
                          </span>
                        )}
                      </div>
                    )}
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
            style={{ color: "#00FF87", background: "rgba(0,255,135,0.06)" }}
          >
            Pakia Zaidi
          </button>
        )}
      </div>
    </div>
  );
}