"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFixtures, getLeagues, Match, League } from "@/lib/api/predictions";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { BookButton } from "@/components/ui/BookButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Calendar, ChevronDown, ArrowLeft, ChevronDown as LoadMoreIcon, Target, TrendingUp, Flame } from "lucide-react";
import { MatchOddsCard } from "@/components/predictions/MatchOddsCard";
import { motion } from "framer-motion";

export default function CreatePredictionStep1() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('create_active_filter');
      return saved || 'today';
    }
    return 'today';
  });
  const [selectedLeague, setSelectedLeague] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('create_selected_league');
      return saved || 'all';
    }
    return 'all';
  });
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const filters = [
    { id: "today", label: "Leo" },
    { id: "tomorrow", label: "Kesho" },
    { id: "this_week", label: "Wiki Hii" },
    { id: "next_week", label: "Wiki Ijayo" },
    { id: "this_month", label: "Mwezi Huu" },
  ];

  const loadMatches = async (filter: string, newOffset = 0) => {
    setLoading(true);
    try {
      const leagueParam = selectedLeague === "all" ? undefined : selectedLeague;
      const data = await getFixtures(undefined, filter, newOffset, 50, leagueParam);
      if (newOffset === 0) {
        setMatches(data);
      } else {
        setMatches(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 50);
      setOffset(newOffset);
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load leagues
    getLeagues().then(setLeagues);
    // Load matches
    loadMatches(activeFilter, 0);
  }, [activeFilter, selectedLeague]);

  // Save filter preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('create_active_filter', activeFilter);
    }
  }, [activeFilter]);

  // Save league preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('create_selected_league', selectedLeague);
    }
  }, [selectedLeague]);

  const handleLoadMore = () => {
    loadMatches(activeFilter, offset + 50);
  };

  const grouped = matches.reduce((acc: Record<string, Match[]>, m) => {
    const key = m.league.name;
    acc[key] = acc[key] || [];
    acc[key].push(m);
    return acc;
  }, {});

  // Sort leagues alphabetically
  const sortedLeagues = Object.keys(grouped).sort();

  // No client-side filtering needed - server handles it now
  const filteredLeagues = sortedLeagues;

  return (
    <div>
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white">Chagua Mechi</h1>
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Anza prediction yako ya AI</p>
      </div>

      {/* Date Filter Tabs */}
      <div className="px-5 pb-4">
        {/* League Select */}
        <div className="mb-4">
          <div className="relative group">
            <div 
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(207, 175, 123, 0.05))",
                border: "1px solid rgba(212, 175, 55, 0.2)"
              }}
            />
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full pl-4 pr-12 py-3.5 rounded-xl text-sm font-semibold appearance-none cursor-pointer transition-all duration-300 relative z-10"
              style={{
                background: "rgba(15, 15, 20, 0.8)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                outline: "none",
                backdropFilter: "blur(20px)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(212, 175, 55, 0.5)";
                e.target.style.boxShadow = "0 4px 25px rgba(212, 175, 55, 0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.12)";
                e.target.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)";
              }}
            >
              <option value="all" style={{ background: "#0f0f14", color: "white", fontWeight: "600" }}>Ligi Zote</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.poisson_key} style={{ background: "#0f0f14", color: "white", fontWeight: "500" }}>
                  {league.name}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={20} 
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-transform duration-300 group-hover:translate-y-0.5" 
              style={{ color: "rgba(255,255,255,0.5)" }}
            />
          </div>
        </div>
        <div className="relative">
          <div 
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory'
            }}
          >
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all snap-start shrink-0"
                style={{
                  background: activeFilter === filter.id ? "rgba(212, 175, 55, 0.2)" : "rgba(255,255,255,0.05)",
                  color: activeFilter === filter.id ? "#D4AF37" : "rgba(255,255,255,0.6)",
                  border: activeFilter === filter.id ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)",
                  minWidth: 'fit-content'
                }}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {filter.label}
                </div>
              </button>
            ))}
          </div>
          {/* Scroll indicators */}
          <div className="absolute right-0 top-0 bottom-2 w-8 pointer-events-none" style={{ background: "linear-gradient(to right, transparent, #0a0a0a)" }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {matches.length} mechi
          </span>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 space-y-5">
        {loading ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-dvh text-center pt-20">
            <div className="text-6xl mb-4">🏟️</div>
            <p className="text-xl font-bold text-white mb-2">Hakuna Mechi</p>
            <p className="text-sm text-white/60 max-w-xs">
              Hakuna mechi kwa {filters.find(f => f.id === activeFilter)?.label}. Jaribu filter nyingine.
            </p>
          </div>
        ) : (
          filteredLeagues.map((league) => (
            <motion.div 
              key={league}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Flame size={12} className="text-[#D4AF37]" />
                {league}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped[league].map((m, index) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => router.push(`/create/${m.id}/overview`)}
                  >
                    <GlassCard 
                      hover 
                      texture 
                      className="p-4 cursor-pointer"
                    >
                      {/* Match Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-[#D4AF37]" />
                          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                            {new Date(m.kickoff_at).toLocaleDateString("sw-TZ", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={12} className="text-[#00FF87]" />
                          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                            {new Date(m.kickoff_at).toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit" })}
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

                          {/* VS */}
                          <div className="px-2 py-1 rounded-lg bg-white/5 flex-shrink-0">
                            <span className="text-xs font-bold text-white/40">VS</span>
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

                      {/* Stage Badge */}
                      {m.stage_display && (
                        <div className="mb-3">
                          <span className="text-xs rounded-full px-3 py-1 font-semibold" style={{ background: "rgba(255,214,0,0.1)", color: "#FFD600", border: "1px solid rgba(255,214,0,0.2)" }}>
                            {m.stage_display}{m.group_name ? ` • ${m.group_name}` : ""}
                          </span>
                        </div>
                      )}

                      {/* Integrated Odds Card */}
                      <MatchOddsCard 
                        matchId={m.id} 
                        homeTeam={m.home_team.name} 
                        awayTeam={m.away_team.name}
                        compact={true}
                      />
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <BookButton onClick={handleLoadMore} icon={LoadMoreIcon} loading={loading} disabled={loading}>
            Pakia Zaidi
          </BookButton>
        </div>
      )}
    </div>
  );
}