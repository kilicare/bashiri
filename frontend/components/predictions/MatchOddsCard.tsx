"use client";
import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { getMatchOdds, type OddsBookmaker } from "@/lib/api/predictions";

interface MatchOddsCardProps {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  compact?: boolean;
}

export function MatchOddsCard({ matchId, homeTeam, awayTeam, compact = false }: MatchOddsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [odds, setOdds] = useState<OddsBookmaker[]>([]);

  const loadOdds = async () => {
    if (odds.length > 0) return;
    
    setLoading(true);
    try {
      const data = await getMatchOdds(matchId);
      setOdds(data.odds);
    } catch (error) {
      console.error("Failed to load odds:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling to parent button
    if (!expanded && odds.length === 0) {
      loadOdds();
    }
    setExpanded(!expanded);
  };

  // Group odds by market type
  const oddsByMarket = odds.reduce((acc, odd) => {
    if (!acc[odd.market_type]) {
      acc[odd.market_type] = [];
    }
    acc[odd.market_type].push(odd);
    return acc;
  }, {} as Record<string, OddsBookmaker[]>);

  // Get best odds for each market
  const getBestOdds = (marketType: string) => {
    const marketOdds = oddsByMarket[marketType] || [];
    
    if (marketType === "1X2") {
      const bestHome = marketOdds.find(o => o.home_win_odds)?.home_win_odds;
      const bestDraw = marketOdds.find(o => o.draw_odds)?.draw_odds;
      const bestAway = marketOdds.find(o => o.away_win_odds)?.away_win_odds;
      return { home: bestHome, draw: bestDraw, away: bestAway };
    } else if (marketType === "OVER_UNDER_2_5") {
      const bestOver = marketOdds.find(o => o.over_odds)?.over_odds;
      const bestUnder = marketOdds.find(o => o.under_odds)?.under_odds;
      return { over: bestOver, under: bestUnder };
    } else if (marketType === "BTTS") {
      const bestYes = marketOdds.find(o => o.btts_yes_odds)?.btts_yes_odds;
      const bestNo = marketOdds.find(o => o.btts_no_odds)?.btts_no_odds;
      return { yes: bestYes, no: bestNo };
    }
    return null;
  };

  const formatOdds = (value: number | string | null | undefined) => {
    if (!value) return "-";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(2);
  };

  if (compact && !expanded) {
    return (
      <button
        onClick={(e) => toggleExpand(e)}
        className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105 shadow-lg"
        style={{ 
          background: "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: "0 4px 12px rgba(192,192,192,0.3)"
        }}
      >
        <TrendingUp size={14} style={{ color: "#333" }} />
        <span className="text-xs font-bold" style={{ color: "#333" }}>Odds</span>
      </button>
    );
  }

  return (
    <div 
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Header */}
      <button
        onClick={(e) => toggleExpand(e)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: "var(--brand-accent)" }} />
          <span className="text-sm font-bold text-white">Live Odds</span>
          {!expanded && odds.length > 0 && (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {Object.keys(oddsByMarket).length} markets
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
        ) : (
          <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="text-center py-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Loading odds...
            </div>
          ) : odds.length === 0 ? (
            <div className="text-center py-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              No odds available
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1X2 Market */}
              {oddsByMarket["1X2"] && (
                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                    1X2 (Home/Draw/Away)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Home</div>
                      <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>{formatOdds(getBestOdds("1X2")?.home)}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Draw</div>
                      <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>{formatOdds(getBestOdds("1X2")?.draw)}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Away</div>
                      <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>{formatOdds(getBestOdds("1X2")?.away)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Over/Under 2.5 Market */}
              {oddsByMarket["OVER_UNDER_2_5"] && (
                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Over/Under 2.5 Goals
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Over 2.5</div>
                      <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>{formatOdds(getBestOdds("OVER_UNDER_2_5")?.over)}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Under 2.5</div>
                      <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>{formatOdds(getBestOdds("OVER_UNDER_2_5")?.under)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* BTTS Market */}
              {oddsByMarket["BTTS"] && (
                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Both Teams to Score
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Yes</div>
                      <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>{formatOdds(getBestOdds("BTTS")?.yes)}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>No</div>
                      <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>{formatOdds(getBestOdds("BTTS")?.no)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookmakers */}
              <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Available from: {Array.from(new Set(odds.map(o => o.bookmaker_name))).join(", ")}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}