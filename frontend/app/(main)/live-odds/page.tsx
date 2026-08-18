"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOdds, getLeagues, type OddsBookmaker, type League } from "@/lib/api/predictions";
import { ArrowLeft, RefreshCw, Filter, ChevronDown, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedOdds } from "@/components/AnimatedOdds";

// Group odds by match for better readability
function groupOddsByMatch(odds: OddsBookmaker[]) {
  const grouped = new Map<number, OddsBookmaker[]>();
  
  odds.forEach(odd => {
    const matchId = odd.match.id;
    if (!grouped.has(matchId)) {
      grouped.set(matchId, []);
    }
    grouped.get(matchId)!.push(odd);
  });
  
  return Array.from(grouped.entries()).map(([matchId, matchOdds]) => ({
    matchId,
    match: matchOdds[0].match,
    odds: matchOdds,
    isLive: matchOdds.some(o => o.is_live)
  }));
}

// Get best odds for each market type from multiple bookmakers
function getBestOddsForMatch(matchOdds: OddsBookmaker[]) {
  const bestOdds: Record<string, any> = {};
  
  matchOdds.forEach(odd => {
    if (odd.market_type === "1X2") {
      if (!bestOdds["1X2"] || (odd.home_win_odds && odd.home_win_odds > bestOdds["1X2"].home)) {
        bestOdds["1X2"] = { 
          home: odd.home_win_odds, 
          draw: odd.draw_odds, 
          away: odd.away_win_odds,
          bookmaker: odd.bookmaker_name
        };
      }
    } else if (odd.market_type === "OVER_UNDER_2_5") {
      if (!bestOdds["OVER_UNDER_2_5"] || (odd.over_odds && odd.over_odds > bestOdds["OVER_UNDER_2_5"].over)) {
        bestOdds["OVER_UNDER_2_5"] = { 
          over: odd.over_odds, 
          under: odd.under_odds,
          bookmaker: odd.bookmaker_name
        };
      }
    } else if (odd.market_type === "BTTS") {
      if (!bestOdds["BTTS"] || (odd.btts_yes_odds && odd.btts_yes_odds > bestOdds["BTTS"].yes)) {
        bestOdds["BTTS"] = { 
          yes: odd.btts_yes_odds, 
          no: odd.btts_no_odds,
          bookmaker: odd.bookmaker_name
        };
      }
    }
  });
  
  return bestOdds;
}

export default function LiveOddsPage() {
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"upcoming" | "live" | "all">("upcoming");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);
  const previousOddsRef = useRef<OddsBookmaker[]>([]);

  // Fetch leagues
  const { data: leagues } = useQuery({
    queryKey: ["leagues"],
    queryFn: () => getLeagues(),
  });

  // Fetch odds
  const { data: odds, isLoading, refetch } = useQuery({
    queryKey: ["odds", selectedLeague, selectedStatus, language],
    queryFn: () => getOdds(selectedLeague, selectedStatus, language),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Group odds by match for better readability
  const groupedMatches = useMemo(() => {
    if (!odds) return [];
    return groupOddsByMatch(odds);
  }, [odds]);

  // Auto-refresh indicator
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Track odds changes for flash animation
  useEffect(() => {
    if (!odds || odds.length === 0) return;

    odds.forEach((odd) => {
      const prevOdd = previousOddsRef.current.find(p => p.id === odd.id);
      if (!prevOdd) return;

      // Check if odds changed
      const currentOdds = {
        home: odd.home_win_odds,
        draw: odd.draw_odds,
        away: odd.away_win_odds,
        over: odd.over_odds,
        under: odd.under_odds,
        bttsYes: odd.btts_yes_odds,
        bttsNo: odd.btts_no_odds,
      };

      const prevOdds = {
        home: prevOdd.home_win_odds,
        draw: prevOdd.draw_odds,
        away: prevOdd.away_win_odds,
        over: prevOdd.over_odds,
        under: prevOdd.under_odds,
        bttsYes: prevOdd.btts_yes_odds,
        bttsNo: prevOdd.btts_no_odds,
      };

      // Trigger flash animation for changed odds
      Object.keys(currentOdds).forEach((key) => {
        const current = currentOdds[key as keyof typeof currentOdds];
        const previous = prevOdds[key as keyof typeof prevOdds];

        if (current !== previous && current !== null && previous !== null) {
          const element = document.getElementById(`odds-${odd.id}-${key}`);
          if (element) {
            // Remove animation class to trigger re-animation
            element.classList.remove('odds-flash', 'odds-increase', 'odds-decrease');

            // Force reflow
            void element.offsetWidth;

            // Determine direction
            const currentNum = typeof current === 'string' ? parseFloat(current) : current;
            const prevNum = typeof previous === 'string' ? parseFloat(previous) : previous;
            const direction = currentNum > prevNum ? 'increase' : 'decrease';

            // Add animation class
            element.classList.add('odds-flash', direction === 'increase' ? 'odds-increase' : 'odds-decrease');

            // Cleanup
            setTimeout(() => {
              element.classList.remove('odds-flash', 'odds-increase', 'odds-decrease');
            }, 800);
          }
        }
      });
    });

    // Update previous odds ref
    previousOddsRef.current = odds;
  }, [odds]);

  useEffect(() => {
    setLastRefresh(new Date());
  }, [odds]);

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #1a1510 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-safe pt-10 pb-4 max-w-7xl mx-auto" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              aria-label="Go back"
              className="p-2 rounded-full transition-all hover:bg-white/10"
            >
              <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">Live Odds</h1>
              <div className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(212,175,55,0.15)", color: "var(--brand-primary)" }}>
                LIVE
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.05)" }}
              aria-label="Refresh odds"
            >
              <RefreshCw size={16} style={{ color: "rgba(255,255,255,0.8)" }} />
            </button>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }} suppressHydrationWarning>
              {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto sm:max-w-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="text-2xl font-black" style={{ color: "var(--brand-primary)" }}>
              {groupedMatches.length || 0}
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {language === "en" ? "Matches" : "Mechi"}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-2xl text-center"
            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
          >
            <div className="text-2xl font-black" style={{ color: "var(--brand-primary)" }}>
              {groupedMatches.filter(m => m.isLive).length || 0}
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {language === "en" ? "Live" : "Inayoendelea"}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-2xl text-center"
            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
          >
            <div className="text-2xl font-black" style={{ color: "var(--brand-primary)" }}>
              {leagues?.length || 0}
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {language === "en" ? "Leagues" : "Ligi"}
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Language Toggle */}
          <div className="flex gap-2 max-w-md mx-auto sm:max-w-none">
            <button
              onClick={() => setLanguage("en")}
              className={`flex-1 sm:flex-none sm:w-40 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                language === "en"
                  ? "bg-[var(--brand-primary)] text-black shadow-lg shadow-[var(--brand-primary)]/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("sw")}
              className={`flex-1 sm:flex-none sm:w-40 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                language === "sw"
                  ? "bg-[var(--brand-primary)] text-black shadow-lg shadow-[var(--brand-primary)]/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              Kiswahili
            </button>
          </div>

          {/* League Filter Dropdown */}
          <div className="relative max-w-md mx-auto sm:max-w-none">
            <button
              onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                <span className="text-sm font-bold text-white">
                  {selectedLeague ? leagues?.find(l => l.code === selectedLeague)?.name : "All Leagues"}
                </span>
              </div>
              <ChevronDown 
                size={16} 
                style={{ color: "rgba(255,255,255,0.4)" }}
                className={`transition-transform ${showLeagueDropdown ? 'rotate-180' : ''}`}
              />
            </button>
            
            <AnimatePresence>
              {showLeagueDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl z-50 max-h-60 overflow-y-auto"
                  style={{ background: "rgba(20,20,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
                >
                  <button
                    onClick={() => { setSelectedLeague(""); setShowLeagueDropdown(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-colors mb-1"
                  >
                    All Leagues
                  </button>
                  {leagues?.map((league) => (
                    <button
                      key={league.code}
                      onClick={() => { setSelectedLeague(league.code); setShowLeagueDropdown(false); }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors mb-1"
                      style={{ 
                        color: selectedLeague === league.code ? "var(--brand-primary)" : "rgba(255,255,255,0.6)",
                        background: selectedLeague === league.code ? "rgba(212,175,55,0.1)" : "transparent"
                      }}
                    >
                      {league.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 max-w-lg mx-auto sm:max-w-none">
            <button
              onClick={() => setSelectedStatus("upcoming")}
              className={`flex-1 sm:flex-none sm:w-32 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                selectedStatus === "upcoming"
                  ? "bg-[var(--brand-primary)] text-black shadow-lg shadow-[var(--brand-primary)]/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {language === "en" ? "Upcoming" : "Zinazofuata"}
            </button>
            <button
              onClick={() => setSelectedStatus("live")}
              className={`flex-1 sm:flex-none sm:w-32 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                selectedStatus === "live"
                  ? "bg-[var(--brand-accent)] text-black shadow-lg shadow-[var(--brand-accent)]/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {language === "en" ? "Live" : "Inayoendelea"}
            </button>
            <button
              onClick={() => setSelectedStatus("all")}
              className={`flex-1 sm:flex-none sm:w-32 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                selectedStatus === "all"
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {language === "en" ? "All" : "Zote"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-2 rounded-full mx-auto mb-4"
              style={{ borderColor: "rgba(212,175,55,0.3)", borderTopColor: "var(--brand-primary)" }}
            />
            <p style={{ color: "rgba(255,255,255,0.5)" }}>
              {language === "en" ? "Loading odds..." : "Inapiga odds..."}
            </p>
          </div>
        ) : groupedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedMatches.map((matchData, index) => (
              <motion.div
                key={matchData.matchId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MatchOddsCard matchData={matchData} language={language} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Filter size={32} style={{ color: "rgba(255,255,255,0.3)" }} />
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              {language === "en" ? "No odds available" : "Hakuna odds inapatikana"}
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {language === "en"
                ? "Try changing your filters or check back later"
                : "Badilisha filters yako au ujaribu tena baadaye"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MatchOddsCard({ matchData, language }: { matchData: { matchId: number; match: any; odds: OddsBookmaker[]; isLive: boolean }; language: "en" | "sw" }) {
  const kickoffTime = new Date(matchData.match.kickoff_at).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const bestOdds = getBestOddsForMatch(matchData.odds);
  const availableBookmakers = Array.from(new Set(matchData.odds.map(o => o.bookmaker_name)));

  return (
    <GlassCard hover texture className="p-4">
      {/* Match Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.45)" }}>
              {matchData.match.league.name}
            </span>
            {matchData.isLive && (
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{ background: "rgba(212,175,55,0.15)", color: "var(--brand-primary)" }}
              >
                {language === "en" ? "LIVE" : "INAYOENDELEA"}
              </motion.span>
            )}
          </div>
          <div className="text-base font-black text-white truncate mb-1">
            {matchData.match.home_team.name} vs {matchData.match.away_team.name}
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }} suppressHydrationWarning>
            {kickoffTime}
          </div>
        </div>
      </div>

      {/* Bookmakers Info */}
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--brand-primary)" }} />
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            {availableBookmakers.length} {language === "en" ? "bookmakers" : "wasimamizi"}
          </div>
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          {availableBookmakers.slice(0, 2).join(", ")}
          {availableBookmakers.length > 2 && ` +${availableBookmakers.length - 2}`}
        </div>
      </div>

      {/* Combined Odds Display */}
      <div className="space-y-3">
        {/* 1X2 Market */}
        {bestOdds["1X2"] && (
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              1X2 ({language === "en" ? "Match Result" : "Matokeo ya Mechi"})
            </div>
            <div className="grid grid-cols-3 gap-2">
              <OddValue
                label={language === "en" ? "Home" : "Nyumbani"}
                value={bestOdds["1X2"].home}
                highlight={true}
                oddId={matchData.matchId}
                oddKey="home"
              />
              <OddValue
                label={language === "en" ? "Draw" : "Sare"}
                value={bestOdds["1X2"].draw}
                highlight={false}
                oddId={matchData.matchId}
                oddKey="draw"
              />
              <OddValue
                label={language === "en" ? "Away" : "Wageni"}
                value={bestOdds["1X2"].away}
                highlight={true}
                oddId={matchData.matchId}
                oddKey="away"
              />
            </div>
          </div>
        )}

        {/* Over/Under 2.5 Market */}
        {bestOdds["OVER_UNDER_2_5"] && (
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              {language === "en" ? "Over/Under 2.5 Goals" : "Zaidi/Chini ya Magoli 2.5"}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <OddValue
                label={language === "en" ? "Over 2.5" : "Zaidi ya 2.5"}
                value={bestOdds["OVER_UNDER_2_5"].over}
                highlight={true}
                oddId={matchData.matchId}
                oddKey="over"
              />
              <OddValue
                label={language === "en" ? "Under 2.5" : "Chini ya 2.5"}
                value={bestOdds["OVER_UNDER_2_5"].under}
                highlight={false}
                oddId={matchData.matchId}
                oddKey="under"
              />
            </div>
          </div>
        )}

        {/* BTTS Market */}
        {bestOdds["BTTS"] && (
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              {language === "en" ? "Both Teams to Score" : "Timu Zote Kufunga"}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <OddValue
                label={language === "en" ? "Yes" : "Ndio"}
                value={bestOdds["BTTS"].yes}
                highlight={true}
                oddId={matchData.matchId}
                oddKey="bttsYes"
              />
              <OddValue
                label={language === "en" ? "No" : "Hapana"}
                value={bestOdds["BTTS"].no}
                highlight={false}
                oddId={matchData.matchId}
                oddKey="bttsNo"
              />
            </div>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }} suppressHydrationWarning>
          {language === "en" ? "Updated" : "Imesasishwa"}: {new Date(Math.max(...matchData.odds.map(o => new Date(o.last_updated).getTime()))).toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand-primary)" }} />
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {language === "en" ? "Live" : "Live"}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function OddValue({ label, value, highlight, oddId, oddKey }: { label: string; value: number | string | null; highlight: boolean; oddId: number; oddKey: string }) {
  // Handle various value types safely
  let numericValue: number | null = null;

  if (value !== null && value !== undefined) {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        numericValue = parsed;
      }
    } else if (typeof value === 'number') {
      numericValue = value;
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`text-center p-3 rounded-xl transition-all ${
        highlight
          ? "bg-[#4ADE80]/10 border border-[#4ADE80]/30 shadow-lg shadow-[#4ADE80]/10"
          : "bg-white/5 border border-white/5 hover:bg-white/10"
      }`}
    >
      <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>
      <div
        id={`odds-${oddId}-${oddKey}`}
        className={`font-bold text-lg ${highlight ? "text-[#4ADE80]" : "text-white"}`}
      >
        {numericValue !== null ? (
          <AnimatedOdds value={numericValue} duration={600} />
        ) : (
          "-"
        )}
      </div>
    </motion.div>
  );
}