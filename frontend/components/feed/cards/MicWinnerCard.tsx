"use client";
import { Trophy, Flame, Heart, Play, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

export function MicWinnerCard({ cardId, data }: { cardId: number; data: any }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  if (!data.winner) return null;

  const { match, winner } = data;
  const moodEmojis: Record<string, string> = {
    FUNNY: "😂",
    FIRE: "🔥",
    ANGRY: "😡",
    RESPECT: "👏",
    SHOCK: "🤯",
    PAIN: "💔",
  };

  const handleClick = () => {
    router.push(`/match/${match.id}/mic`);
  };

  return (
    <div 
      onClick={handleClick}
      className="rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
      style={{ 
        background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04) 40%, var(--surface) 100%)",
        border: "1px solid rgba(212,175,55,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
      }}
    >
      {/* Header with Trophy */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Trophy size={18} style={{ color: "var(--brand-primary)" }} />
            </motion.div>
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: "var(--brand-primary)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          </div>
          <h3 className="text-xs font-medium tracking-wide" style={{ color: "var(--text-primary)" }}>
            Fan of the Match
          </h3>
        </div>
        <Crown size={16} style={{ color: "var(--brand-primary)", opacity: 0.8 }} />
      </div>

      {/* Video Preview - Responsive */}
      <div className="relative aspect-video mx-4 rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
        {winner.video_url && !hasVideoError ? (
          <video
            src={winner.video_url}
            poster={winner.thumbnail_url}
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            onError={() => setHasVideoError(true)}
          />
        ) : winner.thumbnail_url && !imageError ? (
          <img 
            src={winner.thumbnail_url} 
            alt="Winner video" 
            className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(to-br, var(--surface), #000)" }}>
            <Play size={32} style={{ color: "var(--brand-primary)", opacity: 0.5 }} />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Vote Badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <Flame size={12} style={{ color: "var(--warning)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{winner.vote_count || 0}</span>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ background: "var(--brand-primary)", boxShadow: "0 0 24px rgba(212,175,55,0.3)" }}>
            <Play size={24} style={{ color: "var(--background)" }} fill="var(--background)" />
          </div>
        </div>

        {/* Winner Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg" style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}>
          <span className="text-xs font-medium" style={{ color: "var(--background)" }}>🏆 WINNER</span>
        </div>
      </div>

      {/* Content - Responsive */}
      <div className="px-5 py-4">
        {/* Match Info */}
        <div className="mb-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-bold mb-1.5 leading-tight" style={{ color: "var(--text-primary)" }}>
            {match.home_team} <span style={{ color: "var(--brand-primary)" }}>{match.home_score}</span> - <span style={{ color: "var(--brand-primary)" }}>{match.away_score}</span> {match.away_team}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {match.league}
          </p>
        </div>

        {/* Winner Info - Responsive */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}>
            {winner.user.avatar_url ? (
              <img src={winner.user.avatar_url} alt={winner.user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="font-medium text-xl" style={{ color: "var(--background)" }}>{winner.user.username?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>@{winner.user.username}</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{moodEmojis[winner.mood] || "🎬"}</span>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {winner.mood}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Heart size={18} style={{ color: "var(--danger)" }} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
