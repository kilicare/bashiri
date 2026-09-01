"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAIPicks, getAIResultRecap, AIPick, AIResultRecap } from "@/lib/api/predictions";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, TrendingUp, Sparkles, Filter, Check, X, Minus, Clock, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function AIPicksPage() {
  const router = useRouter();
  const [picks, setPicks] = useState<AIPick[]>([]);
  const [recap, setRecap] = useState<AIResultRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"STANDARD" | "PREMIUM">("STANDARD");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("this_week");

  useEffect(() => {
    loadPicks();
    loadRecap();
  }, [feedType, statusFilter, dateRange]);

  const loadPicks = async () => {
    setLoading(true);
    try {
      const data = await getAIPicks({
        feed: feedType,
        status: statusFilter === "all" ? undefined : statusFilter as any,
        range: dateRange as any,
      });
      setPicks(data.results);
    } catch (error) {
      console.error("Failed to load AI picks:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecap = async () => {
    try {
      const data = await getAIResultRecap({
        range: dateRange as any,
        feed: feedType,
      });
      setRecap(data);
    } catch (error) {
      console.error("Failed to load AI recap:", error);
    }
  };

  const selectionLabel: Record<string, string> = {
    "Home": "Home",
    "Draw": "Draw",
    "Away": "Away",
    "1X": "1X",
    "X2": "X2",
    "12": "12",
    "Yes": "Yes",
    "No": "No",
    "Over": "Over",
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    "PENDING": { label: "PENDING", color: "rgba(255, 255, 255, 0.1)", icon: Clock },
    "LIVE": { label: "LIVE", color: "rgba(239, 68, 68, 0.2)", icon: Target },
    "WON": { label: "WON", color: "rgba(76, 175, 80, 0.2)", icon: Check },
    "LOST": { label: "LOST", color: "rgba(239, 68, 68, 0.2)", icon: X },
    "PUSH": { label: "PUSH", color: "rgba(255, 193, 7, 0.2)", icon: Minus },
    "VOID": { label: "VOID", color: "rgba(156, 163, 175, 0.2)", icon: Minus },
  };

  return (
    <div>
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white">AI Picks</h1>
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
          Matangazo ya picks za AI kutoka kwa Poisson model.
        </p>

        {/* Feed Type Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFeedType("STANDARD")}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: feedType === "STANDARD" ? "var(--brand-accent)" : "rgba(255,255,255,0.06)", color: feedType === "STANDARD" ? "#000" : "rgba(255,255,255,0.5)" }}
          >
            Standard Feed
          </button>
          <button
            onClick={() => setFeedType("PREMIUM")}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: feedType === "PREMIUM" ? "var(--brand-accent)" : "rgba(255,255,255,0.06)", color: feedType === "PREMIUM" ? "#000" : "rgba(255,255,255,0.5)" }}
          >
            ★ Premium Feed
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none"
          >
            <option value="all">Status: All</option>
            <option value="PENDING">Pending</option>
            <option value="LIVE">Live</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
            <option value="PUSH">Push</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="this_month">This Month</option>
          </select>
        </div>

        {/* Recap Stats */}
        {recap && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} style={{ color: "var(--brand-primary)" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Result Recap ({dateRange})</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Total</p>
                <p className="text-lg font-black text-white">{recap.total_picks}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Settled</p>
                <p className="text-lg font-black text-white">{recap.settled}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Won</p>
                <p className="text-lg font-black text-white" style={{ color: "#4CAF50" }}>{recap.won}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,255,0.4)" }}>Hit Rate</p>
                <p className="text-lg font-black text-white">{recap.hit_rate}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="px-4"><CardSkeleton /></div>
      ) : picks.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Target size={48} className="mx-auto mb-4" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {feedType === "PREMIUM" ? "No Elite picks available yet." : "No AI picks available for this period."}
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-4 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
            AI Picks ({picks.length})
          </p>
          {picks.map((pick) => {
            const statusInfo = statusConfig[pick.status] || statusConfig["PENDING"];
            const StatusIcon = statusInfo.icon;
            const isElite = pick.tier === "ELITE";

            return (
              <motion.div
                key={pick.pick_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5"
                style={{ background: "#111111", border: isElite ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isElite && <Sparkles size={16} style={{ color: "var(--brand-accent)" }} />}
                    <span className="text-sm font-bold text-white">{pick.tier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ borderColor: statusInfo.color, background: statusInfo.color, color: pick.status === "WON" ? "#4CAF50" : pick.status === "LOST" ? "#F44336" : pick.status === "PUSH" ? "#FFC107" : "rgba(255,255,255,0.6)" }}>
                      <StatusIcon size={10} />
                      {statusInfo.label}
                    </div>
                    <div className="rounded-xl border px-2.5 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{pick.probability_percent}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-bold text-white truncate">{pick.home_team}</span>
                    <span className="text-xs text-white/40">vs</span>
                    <span className="text-sm font-bold text-white truncate">{pick.away_team}</span>
                  </div>
                  {pick.actual_home_score !== null && (
                    <div className="text-lg font-bold" style={{ color: pick.status === "WON" ? "#4CAF50" : pick.status === "LOST" ? "#F44336" : "#FFC107" }}>
                      {pick.actual_home_score}-{pick.actual_away_score}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Market</p>
                    <p className="font-bold text-white">{pick.market_label}</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Selection</p>
                    <p className="font-bold text-white">{selectionLabel[pick.selection] || pick.selection_label}</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Kickoff</p>
                    <p className="font-bold text-white">{new Date(pick.kickoff_at).toLocaleString("sw-TZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
