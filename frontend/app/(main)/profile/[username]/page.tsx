"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Film, Target, TrendingUp, Award, Loader2, User, Calendar, Heart, Eye, ArrowLeft } from "lucide-react";
import { getPublicProfile } from "@/lib/api/auth";
import { MicVideoCard } from "@/components/mic/MicVideoCard";
import { MicReaction } from "@/lib/api/mic";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getPublicProfile(username);
      setProfileData(data);
    } catch (err: any) {
      setError("Mtumiaji hapatikani.");
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-black text-white">Profaili</h1>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-white/10 mb-6"
      >
        <div className="flex items-center gap-4 mb-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover border-2 border-[var(--brand-primary)]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center">
              <span className="text-3xl font-bold text-black">
                {user.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">@{user.username}</h2>
            <p className="text-sm text-white/50">
            Alikuwa mwanachama tangu {new Date(user.date_joined).toLocaleDateString('sw-KE', { year: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white mb-1">{user.total_predictions}</p>
            <p className="text-xs text-white/50">Predictions</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white mb-1">{user.accuracy_percentage}%</p>
            <p className="text-xs text-white/50">Accuracy</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white mb-1">{user.best_streak}</p>
            <p className="text-xs text-white/50">Best Streak</p>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-white/10 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-[var(--brand-accent)]" />
          <h3 className="text-lg font-bold text-white">Mafanikio</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Current Streak</span>
            <span className="text-sm font-bold text-white">{user.current_streak}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Correct Predictions</span>
            <span className="text-sm font-bold text-white">{user.correct_predictions}</span>
          </div>
        </div>
      </motion.div>

      {/* Mic Videos Section */}
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
    </div>
  );
}
