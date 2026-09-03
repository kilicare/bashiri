"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFixtures, getLiveMatches, getFinishedMatches, searchMatches, Match, getLeagues, League } from "@/lib/api/predictions";
import { commandSearch, CommandSearchResults } from "@/lib/api/command-search";
import { Search, ChevronDown, ArrowLeft, ChevronDown as LoadMoreIcon, X, Target, Calendar, TrendingUp, Flame, Plus } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { BookButton } from "@/components/ui/BookButton";
import { DatePicker } from "@/components/ui/DatePicker";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { MatchOddsCard } from "@/components/predictions/MatchOddsCard";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useAuthStore } from "@/stores/auth.store";

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
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  // Initialize state from URL params only. LocalStorage is applied after mount to avoid
  // hydration mismatches between server-rendered HTML and the client state.
  const [tab, setTab] = useState<"fixtures" | "live" | "finished">(
    (searchParams.get("tab") as "fixtures" | "live" | "finished") || "fixtures"
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() =>
    searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date()
  );
  const [useDateInSearch, setUseDateInSearch] = useState(searchParams.get("useDate") === "true");
  const [selectedLeague, setSelectedLeague] = useState(searchParams.get("league") || "");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);
  
  // Intelligent search state
  const [searchResults, setSearchResults] = useState<CommandSearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTab = localStorage.getItem('matches_tab');
    if (savedTab) setTab(savedTab as "fixtures" | "live" | "finished");

    const savedQuery = localStorage.getItem('matches_query');
    if (savedQuery) setQuery(savedQuery);

    const savedDate = localStorage.getItem('matches_date');
    if (savedDate) setSelectedDate(new Date(savedDate));

    const savedUseDate = localStorage.getItem('matches_useDate');
    if (savedUseDate) setUseDateInSearch(savedUseDate === 'true');

    const savedLeague = localStorage.getItem('matches_league');
    if (savedLeague) setSelectedLeague(savedLeague);
  }, []);

  // Intelligent search handler
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      commandSearch(query).then((data) => {
        setSearchResults(data);
        setSearchLoading(false);
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Handle search result clicks
  const handleSearchResultClick = (type: 'match' | 'team' | 'league', id: number, code?: string) => {
    setIsSearchFocused(false);
    if (type === 'match') {
      router.push(`/create/${id}/overview`);
    } else if (type === 'team') {
      router.push(`/team/${id}`);
    } else if (type === 'league' && code) {
      router.push(`/league/${code}`);
    }
  };

  // Function to update URL params without page refresh
  const updateURLParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newURL);
  };

  // State setters that also update URL
  const updateTab = (newTab: typeof tab) => {
    setTab(newTab);
    updateURLParams({ tab: newTab });
  };

  const updateQuery = (newQuery: string) => {
    setQuery(newQuery);
    updateURLParams({ q: newQuery || null });
  };

  const updateSelectedDate = (newDate: Date) => {
    setSelectedDate(newDate);
    updateURLParams({ date: format(newDate, 'yyyy-MM-dd') });
    if (typeof window !== 'undefined') {
      localStorage.setItem('matches_date', newDate.toISOString());
    }
  };

  const updateUseDateInSearch = (newValue: boolean) => {
    setUseDateInSearch(newValue);
    updateURLParams({ useDate: newValue ? "true" : null });
  };

  const updateSelectedLeague = (newLeague: string) => {
    setSelectedLeague(newLeague);
    updateURLParams({ league: newLeague || null });
  };

  const handleRefresh = async () => {
    setLoading(true);
    if (tab === "fixtures") {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await getFixtures(dateStr);
      const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
      setMatches(filtered);
    } else if (tab === "live") {
      const data = await getLiveMatches();
      const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
      setMatches(filtered);
    } else if (tab === "finished") {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await getFinishedMatches(20, 0, selectedLeague || undefined, undefined, dateStr);
      setMatches(data.results);
      setHasMore(data.count > 20);
    }
    setLoading(false);
  };

  useEffect(() => {
    getLeagues().then(setLeagues);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('matches_tab', tab);
    }
  }, [tab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('matches_query', query);
    }
  }, [query]);



  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('matches_useDate', useDateInSearch.toString());
    }
  }, [useDateInSearch]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('matches_league', selectedLeague);
    }
  }, [selectedLeague]);

  useEffect(() => {
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
  }, [tab, selectedDate, selectedLeague, query, useDateInSearch]);

  // Poll matches for all tabs
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // Only poll for fixtures and live - finished matches don't need polling
    if (tab === "fixtures" || tab === "live") {
      interval = setInterval(() => {
        if (tab === "fixtures") {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          getFixtures(dateStr).then((data) => { 
            const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
            setMatches(filtered); 
          });
        } else if (tab === "live") {
          getLiveMatches().then((data) => {
            const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
            setMatches(filtered);
          });
        }
      }, 30000); // Poll every 30 seconds
    }

    // Pause polling when page loses focus
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      } else {
        if (!interval && (tab === "fixtures" || tab === "live")) {
          interval = setInterval(() => {
            if (tab === "fixtures") {
              const dateStr = format(selectedDate, 'yyyy-MM-dd');
              getFixtures(dateStr).then((data) => { 
                const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
                setMatches(filtered); 
              });
            } else if (tab === "live") {
              getLiveMatches().then((data) => {
                const filtered = selectedLeague ? data.filter(m => m.league.code === selectedLeague) : data;
                setMatches(filtered);
              });
            }
          }, 30000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tab, selectedDate, selectedLeague]);

  async function loadMoreFinished() {
    const newOffset = offset + 20;
    const data = await getFinishedMatches(20, newOffset);
    setMatches((prev) => [...prev, ...data.results]);
    setOffset(newOffset);
    setHasMore(newOffset + 20 < data.count);
  }

  async function handleSearch(q: string) {
    updateQuery(q);
    if (q.length < 2) return;
    const dateStr = useDateInSearch ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    const data = await searchMatches(q, dateStr, selectedLeague || undefined);
    setMatches(data.results);
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div>
        <div className="px-5 pt-safe pt-10 pb-3 max-w-7xl mx-auto" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white">Matches</h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-4 mb-4 max-w-2xl mx-auto sm:mx-0 relative" style={{ background: "#151515" }}>
          <Search size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          <input
            ref={searchInputRef}
            className="bg-transparent outline-none text-sm text-white flex-1"
            placeholder="Tafuta timu, ligi, au mechi..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          {query && (
            <button onClick={() => { updateQuery(''); setSearchResults(null); }}>
              <X size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
            </button>
          )}
          {/* Date filter toggle for search */}
          <button
            onClick={() => updateUseDateInSearch(!useDateInSearch)}
            className="px-4 py-2 rounded-full text-xs font-bold transition-colors"
            style={{ 
              background: useDateInSearch ? "var(--brand-accent)" : "rgba(255,255,255,0.06)", 
              color: useDateInSearch ? "#000" : "rgba(255,255,255,0.5)" 
            }}
          >
            {useDateInSearch ? "Date: ON" : "Date: OFF"}
          </button>

          {/* Intelligent Search Results Dropdown */}
          <AnimatePresence>
            {isSearchFocused && query.length >= 2 && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl z-50 max-h-80 overflow-y-auto"
                style={{ background: "#111111", border: "2px solid rgba(212,175,55,0.3)" }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {searchLoading && (
                  <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.4)" }}>Inatafuta...</p>
                )}

                {!searchLoading && searchResults && (
                  <>
                    {searchResults.teams.length > 0 && (
                      <div className="px-2 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Timu</p>
                        {searchResults.teams.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleSearchResultClick('team', t.id)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                              {t.crest_url ? (
                                <img 
                                  src={t.crest_url} 
                                  alt={t.name}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <Target size={16} style={{ color: "#D4AF37" }} className={t.crest_url ? 'hidden' : ''} />
                            </div>
                            <div>
                              <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{t.name}</div>
                              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{t.league?.name || ''}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.leagues.length > 0 && (
                      <div className="px-2 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Ligi</p>
                        {searchResults.leagues.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => handleSearchResultClick('league', l.id, l.code)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                              {l.logo_url ? (
                                <img 
                                  src={l.logo_url} 
                                  alt={l.name}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <Target size={16} style={{ color: "#D4AF37" }} className={l.logo_url ? 'hidden' : ''} />
                            </div>
                            <div>
                              <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{l.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.matches.length > 0 && (
                      <div className="px-2 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Mechi</p>
                        {searchResults.matches.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleSearchResultClick('match', m.id)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                                {m.home_team.crest_url ? (
                                  <img 
                                    src={m.home_team.crest_url} 
                                    alt={m.home_team.name}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <Target size={12} style={{ color: "#D4AF37" }} className={m.home_team.crest_url ? 'hidden' : ''} />
                              </div>
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>vs</span>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                                {m.away_team.crest_url ? (
                                  <img 
                                    src={m.away_team.crest_url} 
                                    alt={m.away_team.name}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <Target size={12} style={{ color: "#D4AF37" }} className={m.away_team.crest_url ? 'hidden' : ''} />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{m.home_team.name} vs {m.away_team.name}</div>
                              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.league.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {!searchLoading && searchResults.matches.length === 0 && searchResults.teams.length === 0 && searchResults.leagues.length === 0 && (
                      <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna matokeo.</p>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Date picker for fixtures and finished tabs */}
        {(tab === "fixtures" || tab === "finished") && (
          <div className="mb-4 max-w-xs mx-auto sm:mx-0">
            <DatePicker selectedDate={selectedDate} onDateChange={updateSelectedDate} />
          </div>
        )}

        {/* League filter dropdown */}
        <div className="mb-4 relative max-w-md mx-auto sm:mx-0">
            <button
              onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
              className="w-full flex items-center justify-between px-4 py-4 rounded-2xl"
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
                  onClick={() => { updateSelectedLeague(""); setShowLeagueDropdown(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-colors"
                >
                  All Leagues
                </button>
                {leagues.map((league) => (
                  <button
                    key={league.code}
                    onClick={() => { updateSelectedLeague(league.code); setShowLeagueDropdown(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors"
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
        
        <div className="flex gap-2 flex-wrap max-w-lg mx-auto sm:max-w-none justify-center sm:justify-start">
          {(["fixtures", "live", "finished"] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateTab(t)}
              className="px-4 py-3 rounded-full text-sm font-bold sm:flex-none sm:w-28"
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
                    className="w-full text-left cursor-pointer"
                  >
                    {/* Match Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Flame size={12} className="text-[#D4AF37]" />
                        <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {m.league.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-[#D4AF37]" />
                        <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {formatMatchDate(m.kickoff_at)}
                        </span>
                      </div>
                    </div>

                    {/* Teams with Logos */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Home Team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/5 flex-shrink-0">
                            {m.home_team.crest_url ? (
                              <img 
                                src={m.home_team.crest_url} 
                                alt={m.home_team.name}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Target size={16} className="text-[#D4AF37] hidden" />
                          </div>
                          <span className="text-sm font-bold text-white truncate">{m.home_team.name}</span>
                        </div>

                        {/* Score/VS */}
                        <div className="px-2 py-1 rounded-lg bg-white/5 flex-shrink-0">
                          {m.status === "LIVE" ? (
                            <span className="text-sm font-black" style={{ color: "var(--success)" }}>{m.home_score}-{m.away_score}</span>
                          ) : m.status === "FINISHED" ? (
                            <span className="text-sm font-black text-white">{m.home_score}-{m.away_score}</span>
                          ) : (
                            <span className="text-xs font-bold text-white/40">VS</span>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-bold text-white truncate text-right">{m.away_team.name}</span>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/5 flex-shrink-0">
                            {m.away_team.crest_url ? (
                              <img 
                                src={m.away_team.crest_url} 
                                alt={m.away_team.name}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Target size={16} className="text-[#D4AF37] hidden" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {m.matchday && <span className="bg-white/5 rounded-full px-2 py-1">Matchday {m.matchday}</span>}
                      {m.status === "LIVE" && (
                        <span className="bg-green-500/20 text-green-400 rounded-full px-2 py-1 font-bold">LIVE</span>
                      )}
                    </div>

                    {/* Stage/Group Info */}
                    {(m.stage_display || m.group_name) && (
                      <div className="flex flex-wrap gap-2 text-xs mb-3">
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
                    
                    {/* Integrated Odds Card */}
                    <MatchOddsCard
                      matchId={m.id}
                      homeTeam={m.home_team.name}
                      awayTeam={m.away_team.name}
                      compact={true}
                    />

                    {/* Create Tip Button */}
                    {user && m.status === "SCHEDULED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tips/create/${m.id}`);
                        }}
                        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition text-sm"
                      >
                        <Plus size={16} />
                        Create Tip
                      </button>
                    )}
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
    </PullToRefresh>
  );
}