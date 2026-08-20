"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getLeagueDetail, LeagueDetail, Match } from "@/lib/api/predictions";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Trophy, Flag, Calendar, Target, Shield, Users } from "lucide-react";
import { format } from "date-fns";

export default function LeagueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leagueCode = params.leagueCode as string;
  const [data, setData] = useState<LeagueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"standings" | "fixtures" | "results" | "teams">("standings");

  useEffect(() => {
    getLeagueDetail(leagueCode).then((leagueData) => {
      setData(leagueData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [leagueCode]);

  if (loading) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;
  if (!data) return <div className="px-4 pt-safe pt-6 text-center text-white/60">League not found</div>;

  const { league, standings, upcoming_matches, finished_matches, teams } = data;

  return (
    <div className="min-h-dvh bg-[#050508] pb-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 sm:px-5 pt-safe pt-10 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
        </div>

        {/* League Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border-2 border-[#D4AF37]/30 overflow-hidden">
            {league.logo_url ? (
              <img src={league.logo_url} alt={league.name} className="w-16 h-16 object-contain" />
            ) : (
              <Trophy size={32} className="text-[#D4AF37]" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{league.name}</h1>
          <div className="flex items-center justify-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{teams.length} Teams</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{upcoming_matches.length} Upcoming</span>
            </div>
          </div>
        </motion.div>

        {/* League Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <GlassCard className="text-center p-3">
              <Target size={16} className="mx-auto mb-2 text-[#00FF87]" />
              <div className="text-lg font-bold text-white">{upcoming_matches.length}</div>
              <div className="text-[10px] text-white/40">Upcoming</div>
            </GlassCard>
            <GlassCard className="text-center p-3">
              <Shield size={16} className="mx-auto mb-2 text-[#FF4757]" />
              <div className="text-lg font-bold text-white">{finished_matches.length}</div>
              <div className="text-[10px] text-white/40">Finished</div>
            </GlassCard>
            <GlassCard className="text-center p-3">
              <Trophy size={16} className="mx-auto mb-2 text-[#D4AF37]" />
              <div className="text-lg font-bold text-white">{standings.length}</div>
              <div className="text-[10px] text-white/40">Teams</div>
            </GlassCard>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {(["standings", "fixtures", "results", "teams"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-none py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-[#D4AF37] text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {tab === "standings" ? "Standings" : tab === "fixtures" ? "Fixtures" : tab === "results" ? "Results" : "Teams"}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-5 pb-6">
        {activeTab === "standings" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {standings.length > 0 ? (
              <GlassCard texture className="overflow-hidden">
                <div className="grid grid-cols-9 gap-2 px-3 py-2 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Team</div>
                  <div className="col-span-1 text-center">P</div>
                  <div className="col-span-1 text-center">W</div>
                  <div className="col-span-1 text-center">D</div>
                  <div className="col-span-1 text-center">L</div>
                  <div className="col-span-1 text-center">Pts</div>
                </div>
                {standings.map((standing, index) => (
                  <div
                    key={standing.id}
                    className="grid grid-cols-9 gap-2 px-3 py-3 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => router.push(`/team/${standing.team.id}`)}
                  >
                    <div className="col-span-1 text-sm font-bold text-white/60">{standing.position}</div>
                    <div className="col-span-3 flex items-center gap-2">
                      {standing.team.crest_url && (
                        <img src={standing.team.crest_url} alt={standing.team.name} className="w-5 h-5 object-contain" />
                      )}
                      <span className="text-sm font-bold text-white truncate">{standing.team.name}</span>
                    </div>
                    <div className="col-span-1 text-center text-sm text-white/60">{standing.matches_played}</div>
                    <div className="col-span-1 text-center text-sm text-[#00FF87]">{standing.won}</div>
                    <div className="col-span-1 text-center text-sm text-[#FFD600]">{standing.draw}</div>
                    <div className="col-span-1 text-center text-sm text-[#FF4757]">{standing.lost}</div>
                    <div className="col-span-1 text-center text-sm font-bold text-[#D4AF37]">{standing.points}</div>
                  </div>
                ))}
              </GlassCard>
            ) : (
              <div className="text-center py-8 text-white/40">Standings not available</div>
            )}
          </motion.div>
        )}

        {activeTab === "fixtures" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {upcoming_matches.length > 0 ? (
              <div className="space-y-3">
                {upcoming_matches.map((match, index) => (
                  <GlassCard key={match.id} hover texture className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {match.league.logo_url && (
                          <img src={match.league.logo_url} alt={match.league.name} className="w-4 h-4 object-contain" />
                        )}
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
                        <div className="flex items-center gap-2">
                          {match.home_team.crest_url && (
                            <img src={match.home_team.crest_url} alt={match.home_team.name} className="w-5 h-5 object-contain" />
                          )}
                          <p className="text-sm font-bold text-white">{match.home_team.name}</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-white/5 text-xs font-bold text-white/40">
                        VS
                      </div>
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <p className="text-sm font-bold text-white">{match.away_team.name}</p>
                          {match.away_team.crest_url && (
                            <img src={match.away_team.crest_url} alt={match.away_team.name} className="w-5 h-5 object-contain" />
                          )}
                        </div>
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
                        {match.league.logo_url && (
                          <img src={match.league.logo_url} alt={match.league.name} className="w-4 h-4 object-contain" />
                        )}
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
                        <div className="flex items-center gap-2">
                          {match.home_team.crest_url && (
                            <img src={match.home_team.crest_url} alt={match.home_team.name} className="w-5 h-5 object-contain" />
                          )}
                          <p className="text-sm font-bold text-white">{match.home_team.name}</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-white/5 text-sm font-bold text-white">
                        {match.home_score} - {match.away_score}
                      </div>
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <p className="text-sm font-bold text-white">{match.away_team.name}</p>
                          {match.away_team.crest_url && (
                            <img src={match.away_team.crest_url} alt={match.away_team.name} className="w-5 h-5 object-contain" />
                          )}
                        </div>
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

        {activeTab === "teams" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {teams.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {teams.map((team, index) => (
                  <button
                    key={team.id}
                    onClick={() => router.push(`/team/${team.id}`)}
                    className="text-left"
                  >
                    <GlassCard
                      hover
                      texture
                      className="p-4 text-center cursor-pointer"
                    >
                      {team.crest_url && (
                        <img src={team.crest_url} alt={team.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
                      )}
                      <p className="text-sm font-bold text-white truncate">{team.name}</p>
                    </GlassCard>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">No teams available</div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}