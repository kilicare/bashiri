"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTeamDetail, TeamDetail, Match } from "@/lib/api/predictions";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Trophy, Flag, Calendar, Target, Shield, Zap } from "lucide-react";
import { format } from "date-fns";

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = Number(params.teamId);
  const [data, setData] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fixtures" | "results" | "table">("fixtures");

  useEffect(() => {
    getTeamDetail(teamId).then((teamData) => {
      setData(teamData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [teamId]);

  if (loading) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;
  if (!data) return <div className="px-4 pt-safe pt-6 text-center text-white/60">Team not found</div>;

  const { team, league, standings, upcoming_matches, finished_matches } = data;

  return (
    <div className="min-h-dvh bg-[#050508] pb-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 sm:px-5 pt-safe pt-10 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
        </div>

        {/* Team Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          {team.crest_url && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border-2 border-white/10">
              <img src={team.crest_url} alt={team.name} className="w-16 h-16 object-contain" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{team.name}</h1>
          {league && (
            <div className="flex items-center justify-center gap-2 text-xs text-white/50">
              {league.logo_url && (
                <img src={league.logo_url} alt={league.name} className="w-4 h-4 object-contain" />
              )}
              <Flag size={12} />
              <span>{league.name}</span>
            </div>
          )}
        </motion.div>

        {/* Standings Card */}
        {standings && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard hover texture className="mb-4 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-[#D4AF37]" />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Current Standings</p>
                  </div>
                  <div className="text-xl font-black px-2 py-1 rounded-lg bg-[#D4AF37]/10" style={{ color: "#D4AF37" }}>#{standings.position}</div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{standings.points}</div>
                    <div className="text-[10px] text-white/40">Points</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{standings.won}</div>
                    <div className="text-[10px] text-white/40">Won</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{standings.draw}</div>
                    <div className="text-[10px] text-white/40">Draw</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{standings.lost}</div>
                    <div className="text-[10px] text-white/40">Lost</div>
                  </div>
                </div>
                {standings.form && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-white/60">Form</p>
                      <div className="flex gap-1">
                        {standings.form.split('').map((result, i) => (
                          <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            result === 'W' ? 'bg-green-500/20 text-green-400' :
                            result === 'D' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Stats Overview */}
        {standings && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <GlassCard className="text-center p-3">
                <Target size={16} className="mx-auto mb-2 text-[#00FF87]" />
                <div className="text-lg font-bold text-white">{standings.goals_for}</div>
                <div className="text-[10px] text-white/40">Goals For</div>
              </GlassCard>
              <GlassCard className="text-center p-3">
                <Shield size={16} className="mx-auto mb-2 text-[#FF4757]" />
                <div className="text-lg font-bold text-white">{standings.goals_against}</div>
                <div className="text-[10px] text-white/40">Goals Against</div>
              </GlassCard>
              <GlassCard className="text-center p-3">
                <Zap size={16} className="mx-auto mb-2 text-[#FFD600]" />
                <div className="text-lg font-bold text-white">{standings.form_rating.toFixed(0)}</div>
                <div className="text-[10px] text-white/40">Form Rating</div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex gap-2 mb-4">
            {(["fixtures", "results", "table"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-[#D4AF37] text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {tab === "fixtures" ? "Fixtures" : tab === "results" ? "Results" : "Table"}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-5 pb-6">
        {activeTab === "fixtures" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {upcoming_matches.length > 0 ? (
              <div className="space-y-3">
                {upcoming_matches.map((match, index) => (
                  <GlassCard key={match.id} hover texture className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Flag size={12} className="text-[#F5A623]" />
                        <p className="text-xs font-semibold text-white/60">{match.league.name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Calendar size={10} />
                        <span>{format(new Date(match.kickoff_at), "MMM d, HH:mm")}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${match.home_team.id === teamId ? 'text-[#00FF87]' : 'text-white'}`}>
                          {match.home_team.name}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-white/5 text-xs font-bold text-white/40">
                        VS
                      </div>
                      <div className="flex-1 text-right">
                        <p className={`text-sm font-bold ${match.away_team.id === teamId ? 'text-[#00FF87]' : 'text-white'}`}>
                          {match.away_team.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/create/${match.id}/overview`)}
                      className="w-full mt-3 py-2 rounded-lg text-xs font-bold bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all"
                    >
                      View Match
                    </button>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">No upcoming fixtures</div>
            )}
          </motion.div>
        )}

        {activeTab === "results" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {finished_matches.length > 0 ? (
              <div className="space-y-3">
                {finished_matches.map((match, index) => (
                  <GlassCard key={match.id} hover texture className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Flag size={12} className="text-[#F5A623]" />
                        <p className="text-xs font-semibold text-white/60">{match.league.name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Calendar size={10} />
                        <span>{format(new Date(match.kickoff_at), "MMM d, HH:mm")}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${match.home_team.id === teamId ? 'text-[#00FF87]' : 'text-white'}`}>
                          {match.home_team.name}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-white/5 text-sm font-bold text-white">
                        {match.home_score} - {match.away_score}
                      </div>
                      <div className="flex-1 text-right">
                        <p className={`text-sm font-bold ${match.away_team.id === teamId ? 'text-[#00FF87]' : 'text-white'}`}>
                          {match.away_team.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/create/${match.id}/overview`)}
                      className="w-full mt-3 py-2 rounded-lg text-xs font-bold bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all"
                    >
                      View Match
                    </button>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">No recent results</div>
            )}
          </motion.div>
        )}

        {activeTab === "table" && league && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => router.push(`/league/${league.code}`)}
              className="w-full mb-4 py-3 rounded-xl text-sm font-bold bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all"
            >
              View Full League Table
            </button>
            {standings ? (
              <GlassCard texture className="overflow-hidden">
                <div className="px-3 py-2 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Current Position
                </div>
                <div className="grid grid-cols-4 gap-2 px-3 py-3">
                  <div>
                    <div className="text-lg font-bold text-white">{standings.position}</div>
                    <div className="text-[10px] text-white/40">Position</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{standings.points}</div>
                    <div className="text-[10px] text-white/40">Points</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{standings.won}</div>
                    <div className="text-[10px] text-white/40">Won</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{standings.matches_played}</div>
                    <div className="text-[10px] text-white/40">Played</div>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <div className="text-center py-8 text-white/40">
                Standings data not available for this team
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}