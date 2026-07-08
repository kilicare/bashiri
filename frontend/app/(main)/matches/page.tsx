"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFixtures, getLiveMatches, getFinishedMatches, searchMatches, Match } from "@/lib/api/predictions";
import { Search } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

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

      <div className="px-4 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <CardSkeleton key={i} />)
        ) : matches.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna mechi kwa sasa.</p>
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
                  className="w-full flex items-center justify-between"
                >
                  <div className="text-left">
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.league.name}</p>
                    <p className="text-sm font-bold text-white">{m.home_team.name} vs {m.away_team.name}</p>
                  </div>
                  {m.status === "LIVE" ? (
                    <span className="text-sm font-black" style={{ color: "#00FF87" }}>{m.home_score}-{m.away_score}</span>
                  ) : m.status === "FINISHED" ? (
                    <span className="text-sm font-black text-white">{m.home_score}-{m.away_score}</span>
                  ) : (
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {new Date(m.kickoff_at).toLocaleDateString("sw-TZ", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </button>
              </GlassCard>
            </motion.div>
          ))
        )}
        {tab === "finished" && hasMore && !loading && (
          <button
            onClick={loadMoreFinished}
            className="w-full py-3 text-sm font-bold rounded-2xl"
            style={{ color: "#00FF87", background: "rgba(0,255,135,0.06)" }}
          >
            Pakia Zaidi
          </button>
        )}
      </div>
    </div>
  );
}