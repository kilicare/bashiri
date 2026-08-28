"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getMatchOverview, getTeamDetail } from "@/lib/api/predictions";
import { BookButton } from "@/components/ui/BookButton";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { PremiumCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { TrendingUp, Calendar, Trophy, Flag, ArrowLeft, BookOpen, Target } from "lucide-react";

export default function MatchOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const [data, setData] = useState<any>(null);
  const [formRange, setFormRange] = useState(5);
  const [h2hRange, setH2hRange] = useState(5);
  const [homeStandings, setHomeStandings] = useState<any>(null);
  const [awayStandings, setAwayStandings] = useState<any>(null);

  useEffect(() => {
    getMatchOverview(matchId, formRange, h2hRange).then(setData);
  }, [matchId, formRange, h2hRange]);

  useEffect(() => {
    if (data?.match) {
      getTeamDetail(data.match.home_team.id).then((teamData) => {
        setHomeStandings(teamData.standings);
      });
      getTeamDetail(data.match.away_team.id).then((teamData) => {
        setAwayStandings(teamData.standings);
      });
    }
  }, [data?.match]);

  if (!data) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  const { match, home_form, away_form, head_to_head } = data;
  const isFinished = match.status === "FINISHED";

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div className="min-h-dvh bg-[#050508] pb-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto px-4 sm:px-5 pt-safe pt-10 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => router.back()} 
              aria-label="Rudi nyuma"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={20} className="text-white/60" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-transparent border border-orange-500/30">
              <Flag size={14} className="text-[#F5A623]" />
              <p className="text-xs font-semibold tracking-wider uppercase text-white/80">
                {match.league.name}
              </p>
            </div>
            {match.stage_display && (
              <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30 text-yellow-400">
                {match.stage_display}{match.group_name ? ` • ${match.group_name}` : ""}
              </span>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight tracking-tight">
            {match.home_team.name} <span className="text-white/30">vs</span> {match.away_team.name}
          </h1>
          
          <div className="flex items-center gap-4 sm:gap-6 text-xs text-white/50 flex-wrap">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <Calendar size={14} className="text-white/40" />
              <span className="font-medium">{new Date(match.kickoff_at).toLocaleDateString("sw-TZ", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <TrendingUp size={14} className="text-white/40" />
              <span className="font-medium">{new Date(match.kickoff_at).toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        <MatchHubTabs matchId={matchId} active="overview" isFinished={isFinished} />

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-5 pb-6">
          {/* Form Guide */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
          >
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
                <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-[#00FF87] shadow-lg shadow-[#00FF87]/30" />
                    <p className="text-sm font-bold text-white">{match.home_team.name}</p>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-xl sm:text-2xl font-black tracking-widest break-all leading-tight" style={{ color: "#00FF87" }}>{home_form.sequence || "—"}</p>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-white/40">Avg Goals</p>
                      <p className="text-sm font-bold text-white">{home_form.avg_goals_scored.toFixed(1)}</p>
                    </div>
                  </div>
                  {home_form.matches && home_form.matches.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {home_form.matches.map((m: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-xs bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all">
                          <span className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded text-[11px] sm:text-[12px] font-bold shadow-lg ${
                            m.result === 'W' ? 'bg-green-500/30 text-green-400 shadow-green-500/20' : 
                            m.result === 'D' ? 'bg-yellow-500/30 text-yellow-400 shadow-yellow-500/20' : 
                            'bg-red-500/30 text-red-400 shadow-red-500/20'
                          }`}>
                            {m.result}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {m.opponent_crest && (
                                <img src={m.opponent_crest} alt="" className="w-5 h-5 object-contain" />
                              )}
                              <span className="text-white/70 truncate font-medium">{m.opponent}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-white/40 text-[10px] font-medium">
                                {new Date(m.date).toLocaleDateString("sw-TZ", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                m.is_home ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {m.is_home ? "HOME" : "AWAY"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">{m.team_goals}-{m.opponent_goals}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-white/30 text-xs">
                      Hakuna data ya form
                    </div>
                  )}
                </div>

                {/* Away Team Form */}
                <div className="bg-gradient-to-br from-yellow-500/10 to-transparent rounded-xl p-4 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-[#FFD600] shadow-lg shadow-[#FFD600]/30" />
                    <p className="text-sm font-bold text-white">{match.away_team.name}</p>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-xl sm:text-2xl font-black tracking-widest break-all leading-tight" style={{ color: "#FFD600" }}>{away_form.sequence || "—"}</p>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-white/40">Avg Goals</p>
                      <p className="text-sm font-bold text-white">{away_form.avg_goals_scored.toFixed(1)}</p>
                    </div>
                  </div>
                  {away_form.matches && away_form.matches.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {away_form.matches.map((m: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-xs bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all">
                          <span className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded text-[11px] sm:text-[12px] font-bold shadow-lg ${
                            m.result === 'W' ? 'bg-green-500/30 text-green-400 shadow-green-500/20' : 
                            m.result === 'D' ? 'bg-yellow-500/30 text-yellow-400 shadow-yellow-500/20' : 
                            'bg-red-500/30 text-red-400 shadow-red-500/20'
                          }`}>
                            {m.result}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {m.opponent_crest && (
                                <img src={m.opponent_crest} alt="" className="w-5 h-5 object-contain" />
                              )}
                              <span className="text-white/70 truncate font-medium">{m.opponent}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-white/40 text-[10px] font-medium">
                                {new Date(m.date).toLocaleDateString("sw-TZ", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                m.is_home ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {m.is_home ? "HOME" : "AWAY"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">{m.team_goals}-{m.opponent_goals}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-white/30 text-xs">
                      Hakuna data ya form
                    </div>
                  )}
                </div>
              </div>
            </PremiumCard>
          </motion.div>

          {/* Head to Head */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
          >
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
                <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5">
                  <TrendingUp size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">Hakuna historia ya mechi kati ya timu hizi.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {head_to_head.map((h: any, i: number) => (
                    <div key={i} className="bg-gradient-to-r from-yellow-500/10 to-transparent rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-white/40 font-medium min-w-0">
                            {new Date(h.date).toLocaleDateString("sw-TZ", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-center sm:justify-end">
                          <span className="text-white/80 font-medium text-sm">{h.home_team}</span>
                          <div className="px-3 py-1 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                            <span className="text-yellow-400 font-bold text-lg">{h.home_score}-{h.away_score}</span>
                          </div>
                          <span className="text-white/80 font-medium text-sm">{h.away_team}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PremiumCard>
          </motion.div>

          {/* League Standings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
          >
            <PremiumCard variant="gradient" hover texture className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-[#D4AF37]" />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>League Standings</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Home Team Standings */}
                {homeStandings ? (
                  <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-[#00FF87] shadow-lg shadow-[#00FF87]/30" />
                      <p className="text-sm font-bold text-white">{match.home_team.name}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xl font-bold text-[#00FF87]">#{homeStandings.position}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Pos</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xl font-bold text-white">{homeStandings.points}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Pts</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xl font-bold text-green-400">{homeStandings.won}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">W</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xl font-bold text-white">{homeStandings.matches_played}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">P</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-green-500/5 to-transparent rounded-xl p-4 border border-green-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-[#00FF87]/50" />
                      <p className="text-sm font-bold text-white">{match.home_team.name}</p>
                    </div>
                    <div className="text-center py-4 bg-white/5 rounded-lg">
                      <Trophy size={24} className="text-white/20 mx-auto mb-2" />
                      <p className="text-xs text-white/40">Standings not available</p>
                    </div>
                  </div>
                )}

                {/* Away Team Standings */}
                {awayStandings ? (
                  <div className="bg-gradient-to-br from-yellow-500/10 to-transparent rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-[#FFD600] shadow-lg shadow-[#FFD600]/30" />
                      <p className="text-sm font-bold text-white">{match.away_team.name}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xl font-bold text-[#FFD600]">#{awayStandings.position}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Pos</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xl font-bold text-white">{awayStandings.points}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Pts</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xl font-bold text-yellow-400">{awayStandings.won}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">W</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xl font-bold text-white">{awayStandings.matches_played}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">P</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-yellow-500/5 to-transparent rounded-xl p-4 border border-yellow-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-[#FFD600]/50" />
                      <p className="text-sm font-bold text-white">{match.away_team.name}</p>
                    </div>
                    <div className="text-center py-4 bg-white/5 rounded-lg">
                      <Trophy size={24} className="text-white/20 mx-auto mb-2" />
                      <p className="text-xs text-white/40">Standings not available</p>
                    </div>
                  </div>
                )}
              </div>
            </PremiumCard>
          </motion.div>

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.35, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl -z-10 animate-pulse" />
            <BookButton 
              onClick={() => router.push(`/create/${matchId}/predict`)} 
              icon={BookOpen}
              className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold"
            >
              Ona Predictions
            </BookButton>
          </motion.div>
        </div>
      </div>
    </DerbyThemeProvider>
  );
}