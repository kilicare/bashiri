"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { LeagueCard } from "@/components/onboarding/LeagueCard";
import { PremiumButton } from "@/components/ui/Button";
import { saveOnboardingPreferences } from "@/lib/api/auth";
import { getLeagues } from "@/lib/api/settings";
import { useAuthStore } from "@/stores/auth.store";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { consumeReturnTo } from "@/lib/return-to";

export default function OnboardingPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchingLeagues, setFetchingLeagues] = useState(true);

  useEffect(() => {
    getLeagues().then((data) => {
      setLeagues(data);
      setFetchingLeagues(false);
    });
  }, []);

  const toggleLeague = (leagueId: number) => {
    setSelectedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(leagueId)) {
        next.delete(leagueId);
      } else {
        next.add(leagueId);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await saveOnboardingPreferences({ favorite_leagues: Array.from(selectedLeagues) });
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
