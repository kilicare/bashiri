"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getMatchOverview } from "@/lib/api/predictions";
import { BashiriButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { PremiumCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { TrendingUp, Calendar, Trophy, Flag, ArrowLeft, ChevronDown } from "lucide-react";

export default function MatchOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const [data, setData] = useState<any>(null);
  const [formRange, setFormRange] = useState(5);
  const [h2hRange, setH2hRange] = useState(5);

  useEffect(() => {
    getMatchOverview(matchId, formRange, h2hRange).then(setData);
  }, [matchId, formRange, h2hRange]);

  if (!data) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  const { match, home_form, away_form, head_to_head } = data;
  const isFinished = match.status === "FINISHED";

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div className="min-h-dvh bg-[#050508] pb-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto px-4 sm:px-5 pt-safe pt-10 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => router.back()} aria-label="Rudi nyuma">
              <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Flag size={14} className="text-[#F5A623]" />
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
              {match.league.name}
            </p>
            {match.stage_display && (
              <span className="ml-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,214,0,0.15)", color: "#FFD600", border: "1px solid rgba(255,214,0,0.3)" }}>
                {match.stage_display}{match.group_name ? ` • ${match.group_name}` : ""}
              </span>
            )}
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
            {match.home_team.name} <span className="text-white/40">vs</span> {match.away_team.name}
          </h1>
          
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-white/40 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{new Date(match.kickoff_at).toLocaleDateString("sw-TZ", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} />
              <span>{new Date(match.kickoff_at).toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        <MatchHubTabs matchId={matchId} active="overview" isFinished={isFinished} />

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-5 pb-6">
          {/* Form Guide */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <PremiumCard variant="gradient" hover texture className="mb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-[#00FF87]" />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Form Guide</p>
                </div>
                <select 
                  value={formRange}
                  onChange={(e) => setFormRange(Number(e.target.value))}
                  className="bg-[#050508]/90 text-white text-xs rounded px-2 py-1 border border-white/20 focus:outline-none focus:border-[#00FF87]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Home Team Form */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#00FF87]" />
                    <p className="text-sm font-bold text-white">{match.home_team.name}</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-black tracking-widest mb-3 break-all" style={{ color: "#00FF87" }}>{home_form.sequence || "—"}</p>
                  {home_form.matches && home_form.matches.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {home_form.matches.map((m: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3 text-xs bg-white/5 rounded-lg p-2">
                          <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded text-[10px] sm:text-[11px] font-bold ${
                            m.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                            m.result === 'D' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {m.result}
                          </span>
                          <span className="text-white/60 truncate flex-1">{m.opponent}</span>
                          <span className="text-white font-bold whitespace-nowrap">{m.team_goals}-{m.opponent_goals}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Away Team Form */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#FFD600]" />
                    <p className="text-sm font-bold text-white">{match.away_team.name}</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-black tracking-widest mb-3 break-all" style={{ color: "#FFD600" }}>{away_form.sequence || "—"}</p>
                  {away_form.matches && away_form.matches.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {away_form.matches.map((m: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3 text-xs bg-white/5 rounded-lg p-2">
                          <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded text-[10px] sm:text-[11px] font-bold ${
                            m.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                            m.result === 'D' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {m.result}
                          </span>
                          <span className="text-white/60 truncate flex-1">{m.opponent}</span>
                          <span className="text-white font-bold whitespace-nowrap">{m.team_goals}-{m.opponent_goals}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PremiumCard>
          </motion.div>

          {/* Head to Head */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <PremiumCard variant="gold" hover texture className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#FFD600]" />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Head to Head</p>
                </div>
                <select 
                  value={h2hRange}
                  onChange={(e) => setH2hRange(Number(e.target.value))}
                  className="bg-[#050508]/90 text-white text-xs rounded px-2 py-1 border border-white/20 focus:outline-none focus:border-[#FFD600]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
              {head_to_head.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-white/40">Hakuna historia ya mechi kati ya timu hizi.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {head_to_head.map((h: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs bg-white/5 rounded-lg p-3 gap-2">
                      <span className="text-white/50 font-medium">{h.date}</span>
                      <span className="text-white font-bold text-center sm:text-right break-all">{h.home_team} <span className="text-[#FFD600]">{h.home_score}-{h.away_score}</span> {h.away_team}</span>
                    </div>
                  ))}
                </div>
              )}
            </PremiumCard>
          </motion.div>

          {/* CTA Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BashiriButton className="w-full" size="lg" onClick={() => router.push(`/create/${matchId}/predict`)}>
              Ona Predictions →
            </BashiriButton>
          </motion.div>
        </div>
      </div>
    </DerbyThemeProvider>
  );
}