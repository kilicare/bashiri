"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFixtures, getLiveMatches, getFinishedMatches, searchMatches, Match, getLeagues, League } from "@/lib/api/predictions";
import { Search, ChevronDown, ArrowLeft, ChevronDown as LoadMoreIcon } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { BookButton } from "@/components/ui/BookButton";
import { DatePicker } from "@/components/ui/DatePicker";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { MatchOddsCard } from "@/components/predictions/MatchOddsCard";

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
  const [tab, setTab] = useState<"fixtures" | "live" | "finished" | "live-odds">("fixtures");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [useDateInSearch, setUseDateInSearch] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);

  useEffect(() => {
    getLeagues().then(setLeagues);
  }, []);

  useEffect(() => {
    if (tab === "live-odds") {
      router.push("/live-odds");
      return;
    }
    setLoading(true);
    setOffset(0);
    if (tab === "fixtures") {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      getFixtures(dateStr).then((data) => { 
        const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
        setMatches(filtered); 
        setLoading(false); 
      });
    } else if (tab === "live") {
      getLiveMatches().then((data) => { 
        const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
        setMatches(filtered); 
        setLoading(false); 
      });
    } else if (tab === "finished") {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      getFinishedMatches(20, 0, selectedLeague || undefined, undefined, dateStr).then((data) => {
        setMatches(data.results);
        setHasMore(data.count > 20);
        setLoading(false);
      });
    }
  }, [tab, selectedDate, selectedLeague, router]);

  // Poll live matches every 15 seconds when on live tab
  useEffect(() => {
    if (tab !== "live") return;
    const interval = setInterval(() => {
      getLiveMatches().then((data) => { 
        const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
        setMatches(filtered); 
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [tab, selectedLeague]);

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
    const dateStr = useDateInSearch ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    const data = await searchMatches(q, dateStr, selectedLeague || undefined);
    setMatches(data.results);
  }

  return (
    <div>
      <div className="px-5 pt-safe pt-10 pb-3 max-w-7xl mx-auto" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white">Matches</h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4 max-w-2xl mx-auto sm:mx-0" style={{ background: "#151515" }}>
          <Search size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          <input
            className="bg-transparent outline-none text-sm text-white flex-1"
            placeholder="Tafuta timu au mechi..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {/* Date filter toggle for search */}
          <button
            onClick={() => setUseDateInSearch(!useDateInSearch)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
            style={{ 
              background: useDateInSearch ? "var(--brand-accent)" : "rgba(255,255,255,0.06)", 
              color: useDateInSearch ? "#000" : "rgba(255,255,255,0.5)" 
            }}
          >
            {useDateInSearch ? "Date: ON" : "Date: OFF"}
          </button>
        </div>
        
        {/* Date picker for fixtures and finished tabs */}
        {(tab === "fixtures" || tab === "finished") && (
          <div className="mb-4 max-w-xs mx-auto sm:mx-0">
            <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
        )}

        {/* League filter dropdown */}
        {tab !== "live-odds" && (
          <div className="mb-4 relative max-w-md mx-auto sm:mx-0">
            <button
              onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: "#151515" }}
            >
              <span className="text-sm font-bold text-white">
                {selectedLeague ? leagues.find(l => l.code === selectedLeague)?.name : "All Leagues"}
              </span>
              <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
            </button>
            
            {showLeagueDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl z-50 max-h-60 overflow-y-auto"
                   style={{ background: "#151515", border: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  onClick={() => { setSelectedLeague(""); setShowLeagueDropdown(false); }}
                  className="w-full text-left px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-colors"
                >
                  All Leagues
                </button>
                {leagues.map((league) => (
                  <button
                    key={league.code}
                    onClick={() => { setSelectedLeague(league.code); setShowLeagueDropdown(false); }}
                    className="w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    style={{ 
                      color: selectedLeague === league.code ? "var(--brand-accent)" : "rgba(255,255,255,0.6)",
                      background: selectedLeague === league.code ? "rgba(207,175,123,0.1)" : "transparent"
                    }}
                  >
                    {league.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap max-w-lg mx-auto sm:max-w-none justify-center sm:justify-start">
          {(["fixtures", "live", "finished", "live-odds"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-full text-sm font-bold sm:flex-none sm:w-28"
              style={{
                background: tab === t ? "var(--brand-accent)" : "rgba(255,255,255,0.06)",
                color: tab === t ? "#000" : "rgba(255,255,255,0.5)",
              }}
            >
              {t === "fixtures" ? "Fixtures" : t === "live" ? "Live" : t === "finished" ? "Finished" : "Live Odds"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <GlassCard hover texture className="p-4 relative">
                  <div
                    onClick={() => router.push(`/create/${m.id}/overview`)}
                    className="w-full text-left cursor-pointer pr-12"
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
                    
                    {/* Integrated Odds Card */}
                    <MatchOddsCard 
                      matchId={m.id} 
                      homeTeam={m.home_team.name} 
                      awayTeam={m.away_team.name}
                      compact={true}
                    />
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
        {tab === "finished" && hasMore && !loading && (
          <BookButton onClick={loadMoreFinished} icon={LoadMoreIcon}>
            Pakia Zaidi
          </BookButton>
        )}
      </div>
    </div>
  );
}