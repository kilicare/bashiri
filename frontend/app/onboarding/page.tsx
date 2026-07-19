"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeagueCard } from "@/components/onboarding/LeagueCard";
import { saveOnboardingPreferences } from "@/lib/api/auth";
import { getLeagues, getTeams } from "@/lib/api/settings";
import { useAuthStore } from "@/stores/auth.store";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { consumeReturnTo } from "@/lib/return-to";

export default function OnboardingPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<Set<number>>(new Set());
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set());
  const [teamsByLeague, setTeamsByLeague] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingLeagues, setFetchingLeagues] = useState(true);
  const [fetchingTeams, setFetchingTeams] = useState(false);

  useEffect(() => {
    getLeagues().then((data) => {
      setLeagues(data);
      setFetchingLeagues(false);
    });
  }, []);

  useEffect(() => {
    if (selectedLeagues.size === 0) {
      setTeamsByLeague({});
      setSelectedTeams(new Set());
      setFetchingTeams(false);
      return;
    }

    let active = true;
    setFetchingTeams(true);

    const selectedLeagueItems = leagues.filter((league) => selectedLeagues.has(league.id));
    Promise.all(
      selectedLeagueItems.map((league) =>
        getTeams(league.poisson_key).then((teams) => [league.id, teams] as const)
      )
    ).then((results) => {
      if (!active) return;
      const nextTeamsByLeague: Record<number, any[]> = {};
      const currentTeamIds = new Set<number>();
      for (const [leagueId, teams] of results) {
        nextTeamsByLeague[leagueId] = teams;
        teams.forEach((team) => currentTeamIds.add(team.id));
      }
      setTeamsByLeague(nextTeamsByLeague);
      setSelectedTeams((prev) => {
        const next = new Set<number>();
        for (const teamId of prev) {
          if (currentTeamIds.has(teamId)) {
            next.add(teamId);
          }
        }
        return next;
      });
      setFetchingTeams(false);
    }).catch(() => {
      if (!active) return;
      setFetchingTeams(false);
    });

    return () => {
      active = false;
    };
  }, [selectedLeagues, leagues]);

  const toggleLeague = (leagueId: number) => {
    setSelectedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(leagueId)) {
        next.delete(leagueId);
        setSelectedTeams((current) => {
          const nextTeams = new Set(current);
          const leagueTeamIds = new Set((teamsByLeague[leagueId] || []).map((team) => team.id));
          leagueTeamIds.forEach((teamId) => nextTeams.delete(teamId));
          return nextTeams;
        });
      } else {
        next.add(leagueId);
      }
      return next;
    });
  };

  const toggleTeam = (teamId: number) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const user = await saveOnboardingPreferences({
        favorite_leagues: Array.from(selectedLeagues),
        favorite_teams: Array.from(selectedTeams),
      });
      if (user) {
        setUser(user);
      }
      router.push(consumeReturnTo() || "/home");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      // Still redirect even if save fails
      router.push(consumeReturnTo() || "/home");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push(consumeReturnTo() || "/home");
  };

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#050508]">
      {/* Premium background effects */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-yellow-500/20 blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-blue-600/20 blur-[180px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/10 blur-[200px]" />
      
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url(https://res.cloudinary.com/dqgdsuok7/image/upload/v1783495293/onboardingpage_hmwakw.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/60 via-[#050508]/50 to-[#050508]/70" />
      
      {/* Content */}
      <div className="relative z-10 min-h-dvh flex flex-col justify-between px-5 pt-10 pb-8 md:px-8 md:pt-12 md:pb-10">

        {/* Header with Logo */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F5A623] to-[#E8892A] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,166,35,0.4)]">
              <span className="text-2xl">⚽</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              BASHIRI
            </span>
          </div>
        </div>

        {/* Premium title section */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl md:text-5xl font-black mb-2 tracking-tight leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>
            Chagua Ligi
          </h1>
          <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#E8892A] text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>
            Unazopenda
          </h1>
          <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-md mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
            Hii itasaidia kupanga Feed yako vizuri zaidi. Unaweza kubadilisha baadaye kwenye Settings.
          </p>
        </div>

        {/* Premium League Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-2xl md:max-w-4xl mx-auto">
          {fetchingLeagues ? (
            [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)
          ) : (
            leagues.map((league: any, index: number) => (
              <div key={league.id} className="animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
                <LeagueCard
                  id={league.id.toString()}
                  name={league.name}
                  logo={league.crest_url || ""}
                  color="#00FF87"
                  selected={selectedLeagues.has(league.id)}
                  onSelect={() => toggleLeague(league.id)}
                />
              </div>
            ))
          )}
        </div>

        {selectedLeagues.size > 0 && (
          <div className="mb-8 w-full max-w-2xl mx-auto space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/50 mb-2">Chagua Timu</p>
              <p className="text-sm text-white/50">Chagua timu unazopenda kwa kila ligi uliyoichagua. Hii itahifadhiwa kwa ushauri wa mechi za timu hizi.</p>
            </div>

            {fetchingTeams ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : (
              leagues
                .filter((league: any) => selectedLeagues.has(league.id))
                .map((league: any) => (
                  <div key={league.id} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{league.name}</p>
                      <span className="text-xs text-white/40">{(teamsByLeague[league.id] || []).length} timu</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(teamsByLeague[league.id] || []).map((team) => {
                        const isSelected = selectedTeams.has(team.id);
                        return (
                          <button
                            key={team.id}
                            onClick={() => toggleTeam(team.id)}
                            className="rounded-2xl p-3 flex items-center gap-2 text-left"
                            style={{
                              background: isSelected ? "rgba(0,255,135,0.1)" : "#111111",
                              border: isSelected ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <span className="text-xs font-bold text-white flex-1 truncate">{team.name}</span>
                            {isSelected && (
                              <span className="text-[var(--brand-accent)] font-bold text-xs">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Premium Buttons */}
        <div className="w-full max-w-md mx-auto space-y-4 mb-8">
          <button 
            onClick={handleContinue}
            disabled={loading}
            className="w-full h-[60px] rounded-full bg-gradient-to-r from-[#F5A623] to-[#E8892A] text-black font-black text-lg tracking-tight flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(245,166,35,0.4)] hover:shadow-[0_0_50px_rgba(245,166,35,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          
          <button 
            onClick={handleSkip}
            className="w-full py-4 text-white/40 text-sm font-medium hover:text-white/60 transition-all duration-300"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
