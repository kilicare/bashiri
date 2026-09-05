"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { PulseIndicatorButton } from "@/components/pulse/PulseIndicatorButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { getNotifications } from "@/lib/api/notifications";
import { useAuthStore } from "@/stores/auth.store";
import { Bell, Target, Search, X, TrendingUp, User, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReviewPromptModal } from "@/components/review/ReviewPromptModal";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { commandSearch, CommandSearchResults } from "@/lib/api/command-search";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CommandSearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search logic
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      commandSearch(searchQuery).then((data) => {
        setSearchResults(data);
        setSearchLoading(false);
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setSearchResults(null);
    }
  }, [showSearch]);

  const handleSearchResultClick = (type: 'match' | 'team' | 'league', id: number, code?: string) => {
    setShowSearch(false);
    if (type === 'match') {
      router.push(`/create/${id}/overview`);
    } else if (type === 'team') {
      router.push(`/team/${id}`);
    } else if (type === 'league' && code) {
      router.push(`/league/${code}`);
    }
  };

  const handleRefresh = async () => {
    // Force refresh of feed and notifications
    setRefreshKey(prev => prev + 1);
    if (user) {
      const data = await getNotifications();
      if (Array.isArray(data)) {
        setUnreadCount(data.filter((notification) => !notification.is_read).length);
      }
    }
  };

  useEffect(() => {
    // Show review modal after 5 seconds if user hasn't seen it
    const hasSeenReviewPrompt = localStorage.getItem('hasSeenReviewPrompt');
    if (!hasSeenReviewPrompt) {
      const timer = setTimeout(() => {
        setShowReviewModal(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    getNotifications()
      .then((data) => {
        if (!active || !Array.isArray(data)) return;
        setUnreadCount(data.filter((notification) => !notification.is_read).length);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-dvh pb-safe">
        {/* Sticky Header */}
        <div className="fixed top-0 left-0 right-0 z-40" style={{ background: "rgba(11, 11, 11, 0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-5 md:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2 gap-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
              <button
                type="button"
                aria-label="Open notifications"
                onClick={() => router.push("/notifications")}
                className="relative w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors flex-shrink-0"
              >
                <Bell size={18} style={{ color: "var(--brand-primary)" }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 text-[9px] font-bold transition-all duration-300 hover:scale-110"
                    style={{ background: "var(--danger)", color: "var(--text-primary)", boxShadow: "0 0 10px var(--danger)" }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                aria-label="Go to AI"
                onClick={() => router.push("/ai")}
                className="relative w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors flex-shrink-0"
              >
                <Brain size={18} style={{ color: "var(--brand-accent)" }} />
              </button>
              <h1 
                className="flex-1 text-center" 
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: "var(--brand-primary)",
                  letterSpacing: "0.08em",
                  textShadow: "0 0 30px rgba(212, 175, 55, 0.4), 0 0 60px rgba(212, 175, 55, 0.2)",
                  background: "linear-gradient(135deg, #D4AF37 0%, #F5D77A 50%, #D4AF37 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                BASHIRI
              </h1>
              <button
                type="button"
                aria-label="Go to Pulse"
                onClick={() => router.push("/pulse")}
                className="relative w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors flex-shrink-0"
              >
                <Target size={18} style={{ color: "#00C878" }} />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 text-[9px] font-bold"
                  style={{ background: "rgba(0,200,120,0.9)", color: "white", boxShadow: "0 0 10px rgba(0,200,120,0.6)" }}>
                  LIVE
                </span>
              </button>
              
              {/* Profile Button */}
              <button
                type="button"
                aria-label="Go to profile"
                onClick={() => {
                  if (user) {
                    router.push("/profile");
                  } else {
                    setShowLoginPrompt(true);
                  }
                }}
                className="relative w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors flex-shrink-0 overflow-hidden"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {!user?.avatar_url && (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5 md:px-6 lg:px-8 pt-4">
          <div className="pt-4 pb-8">
            <HeroCarousel />
          </div>

          {/* Live Odds Section */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard hover glow texture className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.2)" }}>
                      <TrendingUp size={24} style={{ color: "#D4AF37" }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Live Odds</h2>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        Real-time betting odds from top bookmakers
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/live-odds")}
                    className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: "linear-gradient(135deg, #D4AF37 0%, #F5D77A 100%)",
                      color: "#0A0A0A",
                      boxShadow: "0 10px 30px rgba(212,175,55,0.3)"
                    }}
                  >
                    View All Odds
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="text-2xl font-bold" style={{ color: "#00C878" }}>LIVE</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Live Matches
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="text-2xl font-bold" style={{ color: "#D4AF37" }}>$</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Best Odds
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="text-2xl font-bold" style={{ color: "#D4AF37" }}>%</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Market Coverage
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
          
          <FeedContainer externalRefreshKey={refreshKey} />
        </div>

        {/* Review Prompt Modal */}
        <ReviewPromptModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onWriteReview={() => {
            setShowReviewModal(false);
            router.push("/review");
          }}
        />

        {/* Login Prompt Modal */}
        <AnimatePresence>
          {showLoginPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
              onClick={() => setShowLoginPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm rounded-2xl p-6"
                style={{ background: "#111111", border: "1px solid rgba(212,175,55,0.2)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Fungua Account</h3>
                  <button
                    onClick={() => setShowLoginPrompt(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Kuona AI Picks, accuracy stats, na zaidi - fungua account bure.
                </p>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowLoginPrompt(false);
                      router.push("/login");
                    }}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: "linear-gradient(135deg, #D4AF37 0%, #F5D77A 100%)",
                      color: "#0A0A0A",
                      boxShadow: "0 10px 30px rgba(212,175,55,0.3)"
                    }}
                  >
                    Endelea
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Modal */}
        <AnimatePresence>
          {showSearch && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                onClick={() => setShowSearch(false)}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg mx-6 max-w-[calc(100vw-3rem)]"
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--surface)",
                    border: "2px solid rgba(212,175,55,0.3)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
                    <Search size={20} style={{ color: "#D4AF37" }} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search teams, leagues, matches..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-lg"
                      style={{ color: "var(--text-primary)" }}
                    />
                    <button
                      onClick={() => setShowSearch(false)}
                      className="grid place-items-center rounded-lg p-2 transition-all hover:scale-105"
                      style={{ background: "rgba(212,175,55,0.1)" }}
                    >
                      <X size={18} style={{ color: "#D4AF37" }} />
                    </button>
                  </div>

                  {/* Results */}
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {searchLoading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          Searching...
                        </div>
                      </div>
                    )}
                    
                    {!searchLoading && searchQuery.trim().length < 2 && (
                      <div className="flex items-center justify-center py-8 px-4">
                        <div className="text-sm text-center w-full max-w-full" style={{ color: "var(--text-secondary)" }}>
                          Type at least 2 characters to search
                        </div>
                      </div>
                    )}
                    
                    {!searchLoading && searchQuery.trim().length >= 2 && !searchResults && (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          No results found
                        </div>
                      </div>
                    )}
                    
                    {!searchLoading && searchResults && (
                      <div className="space-y-1">
                        {/* Teams */}
                        {searchResults.teams && searchResults.teams.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                              Teams
                            </div>
                            {searchResults.teams.map((team) => (
                              <button
                                key={team.id}
                                onClick={() => handleSearchResultClick('team', team.id)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                                style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                              >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                                  {team.crest_url ? (
                                    <img 
                                      src={team.crest_url} 
                                      alt={team.name}
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <Target size={16} style={{ color: "#D4AF37" }} className={team.crest_url ? 'hidden' : ''} />
                                </div>
                                <div>
                                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{team.name}</div>
                                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{team.league?.name || ''}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Leagues */}
                        {searchResults.leagues && searchResults.leagues.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                              Leagues
                            </div>
                            {searchResults.leagues.map((league) => (
                              <button
                                key={league.code}
                                onClick={() => handleSearchResultClick('league', league.id, league.code)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                                style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                              >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                                  {league.logo_url ? (
                                    <img 
                                      src={league.logo_url} 
                                      alt={league.name}
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <Target size={16} style={{ color: "#D4AF37" }} className={league.logo_url ? 'hidden' : ''} />
                                </div>
                                <div>
                                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{league.name}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Matches */}
                        {searchResults.matches && searchResults.matches.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                              Matches
                            </div>
                            {searchResults.matches.map((match) => (
                              <button
                                key={match.id}
                                onClick={() => handleSearchResultClick('match', match.id)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                                style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                              >
                                <div className="flex items-center gap-2">
                                  {/* Home Team Logo */}
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                                    {match.home_team.crest_url ? (
                                      <img 
                                        src={match.home_team.crest_url} 
                                        alt={match.home_team.name}
                                        className="w-full h-full object-contain p-1"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    <Target size={12} style={{ color: "#D4AF37" }} className={match.home_team.crest_url ? 'hidden' : ''} />
                                  </div>
                                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>vs</span>
                                  {/* Away Team Logo */}
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                                    {match.away_team.crest_url ? (
                                      <img 
                                        src={match.away_team.crest_url} 
                                        alt={match.away_team.name}
                                        className="w-full h-full object-contain p-1"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    <Target size={12} style={{ color: "#D4AF37" }} className={match.away_team.crest_url ? 'hidden' : ''} />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{match.home_team.name} vs {match.away_team.name}</div>
                                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{match.league.name}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PullToRefresh>
  );
}