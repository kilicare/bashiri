"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { getMatchOdds, type OddsBookmaker } from "@/lib/api/predictions";
import { shouldReduceMotion } from "@/utils/animation";

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

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expanded) {
      setExpanded(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getMatchOdds(matchId);
      setOdds(data.odds || []);
      setExpanded(true);
    } catch (error) {
      console.error("Failed to fetch odds:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group odds by market type
  const oddsByMarket = odds.reduce((acc, odd) => {
    if (!acc[odd.market_type]) {
      acc[odd.market_type] = [];
    }
    acc[odd.market_type].push(odd);
    return acc;
  }, {} as Record<string, OddsBookmaker[]>);

  const animationDuration = shouldReduceMotion() ? 0 : 0.3;

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
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
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: animationDuration }}
        >
          {expanded ? (
            <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          ) : (
            <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          )}
        </motion.div>
      </button>

      {/* Content with smooth animation */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: animationDuration }}
            className="px-4 pb-4"
          >
            {loading ? (
              <div className="text-center py-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Loading odds...
              </div>
            ) : odds.length === 0 ? (
              <div className="text-center py-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                No odds available
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                {/* 1X2 Market */}
                {oddsByMarket["1X2"] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                      1X2 (Home/Draw/Away)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {oddsByMarket["1X2"].slice(0, 3).map((odd, idx) => (
                        <motion.div
                          key={odd.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + idx * 0.05 }}
                          className="text-center p-2 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{odd.bookmaker_name}</div>
                          <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>
                            {odd.home_win_odds || odd.draw_odds || odd.away_win_odds || "N/A"}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Over/Under 2.5 Market */}
                {oddsByMarket["OVER_UNDER_2_5"] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Over/Under 2.5 Goals
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {oddsByMarket["OVER_UNDER_2_5"].slice(0, 2).map((odd, idx) => (
                        <motion.div
                          key={odd.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + idx * 0.05 }}
                          className="text-center p-2 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{odd.bookmaker_name}</div>
                          <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>
                            {odd.over_odds || odd.under_odds || "N/A"}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* BTTS Market */}
                {oddsByMarket["BTTS"] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Both Teams to Score
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {oddsByMarket["BTTS"].slice(0, 2).map((odd, idx) => (
                        <motion.div
                          key={odd.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + idx * 0.05 }}
                          className="text-center p-2 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{odd.bookmaker_name}</div>
                          <div className="text-sm font-bold" style={{ color: "#4ADE80" }}>
                            {odd.btts_yes_odds || odd.btts_no_odds || "N/A"}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Bookmakers */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="pt-2 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Available from: {Array.from(new Set(odds.map(o => o.bookmaker_name))).join(", ")}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}