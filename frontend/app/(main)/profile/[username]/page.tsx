"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Film, Target, TrendingUp, Award, Loader2, User, Calendar, Heart, Eye, ArrowLeft, Flame, Medal, Brain, CheckCircle, XCircle, Clock, Shield, Crown, Users, Zap, Star, UserPlus, UserMinus } from "lucide-react";
import { getPublicProfile, followUser, unfollowUser, checkFollowStatus, getFollowing } from "@/lib/api/auth";
import { getUserTips, getTipLeaderboard } from "@/lib/api/tips";
import { MicVideoCard } from "@/components/mic/MicVideoCard";
import { MicReaction } from "@/lib/api/mic";
import { TipPerformance, UserTipList } from "@/lib/types/tips";
import { TipCard } from "@/components/tips/TipCard";
import { VerifiedBadges } from "@/components/tips/VerifiedBadges";
import { useAuthStore } from "@/stores/auth.store";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [tipPerformance, setTipPerformance] = useState<TipPerformance | null>(null);
  const [userTips, setUserTips] = useState<UserTipList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "tips" | "mic">("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [serverFollowStatus, setServerFollowStatus] = useState<boolean | null>(null);
  const [followersCount, setFollowersCount] = useState<number | null>(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const [profile, performance, tips] = await Promise.all([
        getPublicProfile(username),
        getTipLeaderboard().then(data => {
          const userPerf = data.results.find((p: TipPerformance) => p.user.username === username);
          return userPerf || null;
        }),
        getUserTips(username).then(data => data.results || [])
      ]);
      
      setProfileData(profile);
      setTipPerformance(performance);
      setUserTips(tips);
      
      // Set followers count from server response
      if (profile.user && profile.user.followers_count !== undefined) {
        setFollowersCount(profile.user.followers_count);
      }
      
      // Use follow status from backend response
      if (profile.is_following !== undefined) {
        setIsFollowing(profile.is_following);
        setServerFollowStatus(profile.is_following);
      } else if (currentUser && profile.user.username !== currentUser.username) {
        // Fallback: Check if current user is following this profile
        try {
          const followStatus = await checkFollowStatus(username);
          setIsFollowing(followStatus.is_following);
          setServerFollowStatus(followStatus.is_following);
        } catch (err) {
          // If check-follow endpoint doesn't exist, try to infer from following list
          try {
            const followingData = await getFollowing();
            const isFollowing = followingData.results.some((u: any) => u.username === username);
            setIsFollowing(isFollowing);
            setServerFollowStatus(isFollowing);
          } catch (err2) {
            // If that also fails, default to false
            console.error('Failed to check follow status via following list:', err2);
            setIsFollowing(false);
            setServerFollowStatus(false);
          }
        }
      } else {
        setIsFollowing(false);
        setServerFollowStatus(false);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError("Mtumiaji hapatikani.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await unfollowUser(username);
        setIsFollowing(false);
        setServerFollowStatus(false);
        if (followersCount !== null) {
          setFollowersCount(Math.max(0, followersCount - 1));
        }
        if (profileData?.user) {
          setProfileData({
            ...profileData,
            user: {
              ...profileData.user,
              followers_count: Math.max(0, (profileData.user.followers_count || 0) - 1)
            }
          });
        }
      } else {
        await followUser(username);
        setIsFollowing(true);
        setServerFollowStatus(true);
        if (followersCount !== null) {
          setFollowersCount(followersCount + 1);
        }
        if (profileData?.user) {
          setProfileData({
            ...profileData,
            user: {
              ...profileData.user,
              followers_count: (profileData.user.followers_count || 0) + 1
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Follow/unfollow error:', error);
      
      // Handle case where user is already following (backend returns 400)
      if (error?.message?.includes('Umesha follow mtumiaji huyu') || 
          error?.message?.includes('already following')) {
        // Update local state to reflect that they are following
        setIsFollowing(true);
        setServerFollowStatus(true);
        return; // Don't show error to user
      }
      
      // Handle case where user is not following (for unfollow)
      if (error?.message?.includes('Huja follow mtumiaji huyu') || 
          error?.message?.includes('not following')) {
        // Update local state to reflect that they are not following
        setIsFollowing(false);
        setServerFollowStatus(false);
        return; // Don't show error to user
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh px-5 pt-safe pt-10 pb-4 flex items-center justify-center" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="text-center">
          <Loader2 size={48} className="text-white/30 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Inapakia profaili...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-dvh px-5 pt-safe pt-10 pb-4 flex items-center justify-center" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Mtumiaji Hapatikani</h3>
          <p className="text-sm text-white/50 mb-6">
            Profaili unayotafuta haipo.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black hover:opacity-90 transition-opacity"
          >
            Rudi Nyumbani
          </button>
        </div>
      </div>
    );
  }

  const user = profileData.user;
  const micReactions = profileData.mic_reactions || [];
  const micCount = profileData.mic_count || 0;
  const userTipsList = userTips || [];

  return (
    <div className="min-h-dvh px-5 pt-safe pt-10 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} aria-label="Rudi nyuma">
          <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center">
          <User size={20} className="text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Profaili</h1>
          <p className="text-sm text-white/50">Performance analytics & tips</p>
        </div>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-6 border border-white/10 mb-6 relative overflow-hidden"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600" />

        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/10 ring-2 ring-blue-500/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white/10 ring-2 ring-blue-500/30">
                <span className="text-3xl font-bold text-white">
                  {user.username?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            {/* Verified badge */}
            {tipPerformance && tipPerformance.total_tips >= 10 && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                <Shield size={16} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">@{user.username}</h2>
              {tipPerformance && tipPerformance.total_tips >= 10 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full border border-green-500/30">
                  <CheckCircle size={12} className="text-green-400" />
                  <span className="text-xs font-bold text-green-400">Verified</span>
                </div>
              )}
            </div>
            <p className="text-sm text-white/50 mb-2">
              Member since {new Date(user.date_joined).toLocaleDateString('sw-KE', { year: 'numeric', month: 'long' })}
            </p>
            <div className="flex items-center gap-4 text-sm mb-3">
              <div className="flex items-center gap-1 text-white/70">
                <Users size={14} />
                <span>{followersCount !== null ? followersCount : (user.followers_count || 0)} followers</span>
              </div>
              {tipPerformance && tipPerformance.tipster_score > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-yellow-400 font-bold">{tipPerformance.tipster_score}</span>
                </div>
              )}
            </div>
            
            {/* Follow/Unfollow Button */}
            {currentUser && user.username !== currentUser.username && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  isFollowing
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {followLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus size={16} />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Stats */}
        {tipPerformance ? (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 text-center border border-blue-500/30">
              <p className="text-2xl font-black text-white mb-1">{tipPerformance.total_tips}</p>
              <p className="text-xs text-white/50">Verified Tips</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 text-center border border-green-500/30">
              <p className="text-2xl font-black text-white mb-1">{tipPerformance.accuracy_percentage}%</p>
              <p className="text-xs text-white/50">Accuracy</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-4 text-center border border-orange-500/30">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame size={16} className={tipPerformance.current_streak >= 3 ? 'text-orange-400' : 'text-white/50'} />
                <p className="text-2xl font-black text-white">{tipPerformance.current_streak}</p>
              </div>
              <p className="text-xs text-white/50">Current Streak</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-2xl p-4 text-center border border-yellow-500/30">
              <p className="text-2xl font-black text-white mb-1">{tipPerformance.best_streak}</p>
              <p className="text-xs text-white/50">Best Streak</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-black text-white mb-1">{user.total_predictions || 0}</p>
              <p className="text-xs text-white/50">Predictions</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-black text-white mb-1">{user.accuracy_percentage || 0}%</p>
              <p className="text-xs text-white/50">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-black text-white mb-1">{user.best_streak || 0}</p>
              <p className="text-xs text-white/50">Best Streak</p>
            </div>
          </div>
        )}

        {/* Recent Form */}
        {tipPerformance && tipPerformance.recent_form_tips > 0 && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-white/50" />
                <span className="text-sm font-bold text-white">Recent Form (Last 10)</span>
              </div>
              <span className="text-sm font-bold text-[var(--brand-accent)]">
                {tipPerformance.recent_form_correct}/{tipPerformance.recent_form_tips}
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: tipPerformance.recent_form_tips }).map((_, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                    i < tipPerformance.recent_form_correct
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {i < tipPerformance.recent_form_correct ? '✓' : '✗'}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "overview", label: "Overview" },
          { key: "tips", label: "Tips" },
          { key: "mic", label: "Mic Videos" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Market Specialization */}
          {tipPerformance && tipPerformance.market_specialization && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-white/10 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Medal size={20} className="text-[var(--brand-accent)]" />
                <h3 className="text-lg font-bold text-white">Market Specialist</h3>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{tipPerformance.market_specialization.market}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[var(--brand-accent)]">
                      {tipPerformance.market_specialization.accuracy}%
                    </span>
                    <span className="text-xs text-white/50">
                      ({tipPerformance.market_specialization.sample_size} tips)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* League Specialization */}
          {tipPerformance && tipPerformance.league_specialization && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-white/10 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Crown size={20} className="text-[var(--brand-accent)]" />
                <h3 className="text-lg font-bold text-white">League Specialist</h3>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{tipPerformance.league_specialization.league}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[var(--brand-accent)]">
                      {tipPerformance.league_specialization.accuracy}%
                    </span>
                    <span className="text-xs text-white/50">
                      ({tipPerformance.league_specialization.sample_size} tips)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Verified Badges */}
          {tipPerformance && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-white/10 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-[var(--brand-accent)]" />
                <h3 className="text-lg font-bold text-white">Verified Badges</h3>
              </div>
              <VerifiedBadges performance={tipPerformance} />
            </motion.div>
          )}

          {/* Detailed Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-white/10 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} className="text-[var(--brand-accent)]" />
              <h3 className="text-lg font-bold text-white">Performance Stats</h3>
            </div>
            
            {tipPerformance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70">Total Tips</span>
                  <span className="text-sm font-bold text-white">{tipPerformance.total_tips}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70">Correct Tips</span>
                  <span className="text-sm font-bold text-green-400">{tipPerformance.correct_tips}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70">Incorrect Tips</span>
                  <span className="text-sm font-bold text-red-400">{tipPerformance.incorrect_tips}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70">Void Tips</span>
                  <span className="text-sm font-bold text-gray-400">{tipPerformance.void_tips}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70">Best Streak</span>
                  <span className="text-sm font-bold text-white">{tipPerformance.best_streak}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70">Total Upvotes</span>
                  <span className="text-sm font-bold text-white">{tipPerformance.total_upvotes_received}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70">Current Streak</span>
                  <span className="text-sm font-bold text-white">{user.current_streak || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70">Correct Predictions</span>
                  <span className="text-sm font-bold text-white">{user.correct_predictions || 0}</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {activeTab === "tips" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-[var(--brand-accent)]" />
            <h3 className="text-lg font-bold text-white">Tips ({userTipsList.length})</h3>
          </div>

          {userTipsList.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-white/10 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Target size={40} className="text-white/30" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Hakuna Tips Bado</h3>
              <p className="text-sm text-white/50">
                Mtumiaji huyu hajapost tips yoyote.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userTipsList.map((tip) => (
                <TipCard key={tip.id} tip={tip} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "mic" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Film size={20} className="text-[var(--brand-accent)]" />
            <h3 className="text-lg font-bold text-white">Video za Mic</h3>
            <span className="text-sm text-white/50">({micCount})</span>
          </div>

          {micReactions.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-white/10 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Film size={40} className="text-white/30" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Hakuna Video Bado</h3>
              <p className="text-sm text-white/50">
                Mtumiaji huyu hajapost video yoyote kwenye Mic.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {micReactions.map((reaction: MicReaction) => (
                <div key={reaction.id} className="bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden border border-white/10">
                  <div className="relative aspect-video bg-black">
                    {reaction.video_url && (
                      <video
                        src={reaction.video_url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm">
                      <span className="text-xs font-bold text-white">
                        {reaction.duration_seconds}s
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Heart size={16} className="text-red-500" />
                        <span className="text-sm font-bold text-white">{reaction.vote_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye size={16} className="text-blue-400" />
                        <span className="text-sm text-white/70">Views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Calendar size={14} />
                      <span>{new Date(reaction.created_at).toLocaleDateString('sw-KE')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}