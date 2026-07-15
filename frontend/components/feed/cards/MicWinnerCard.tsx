"use client";
import { Trophy, Flame, Heart, Play, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MicWinnerCard({ cardId, data }: { cardId: number; data: any }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

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
      className="rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ 
        background: "linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 50%, #16213e 100%)",
        border: "2px solid rgba(255,215,0,0.4)",
        boxShadow: "0 8px 32px rgba(255,215,0,0.15)"
      }}
    >
      {/* Header with Trophy */}
      <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Trophy size={18} className="text-yellow-400 sm:size-[20px]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          </div>
          <h3 className="text-xs sm:text-sm font-black text-white tracking-wide">
            Fan of the Match
          </h3>
        </div>
        <Crown size={16} className="text-yellow-400 opacity-80 sm:size-[18px]" />
      </div>

      {/* Video Preview - Responsive */}
      <div className="relative aspect-video bg-black mx-3 sm:mx-4 rounded-2xl overflow-hidden">
        {winner.thumbnail_url && !imageError ? (
          <img 
            src={winner.thumbnail_url} 
            alt="Winner video" 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <Play size={32} className="text-yellow-400 opacity-50" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Vote Badge */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,165,0,0.5)" }}>
          <Flame size={12} className="text-orange-400 sm:size-[14px]" />
          <span className="text-[10px] sm:text-xs font-bold text-white">{winner.vote_count || 0}</span>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ background: "rgba(255,215,0,0.9)", boxShadow: "0 0 30px rgba(255,215,0,0.5)" }}>
            <Play size={20} className="text-black ml-1 sm:size-[24px]" fill="black" />
          </div>
        </div>

        {/* Winner Badge */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-2 sm:px-3 py-1 rounded-lg" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
          <span className="text-[10px] sm:text-xs font-black text-black">🏆 WINNER</span>
        </div>
      </div>

      {/* Content - Responsive */}
      <div className="px-4 sm:px-5 py-3 sm:py-4">
        {/* Match Info */}
        <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs sm:text-sm font-black text-white mb-1 leading-tight">
            {match.home_team} <span style={{ color: "#FFD700" }}>{match.home_score}</span> - <span style={{ color: "#FFD700" }}>{match.away_score}</span> {match.away_team}
          </p>
          <p className="text-[10px] sm:text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {match.league}
          </p>
        </div>

        {/* Winner Info - Responsive */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F5A623, #FFD700)" }}>
            {winner.user.avatar_url ? (
              <img src={winner.user.avatar_url} alt={winner.user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="font-black text-black text-lg sm:text-xl">{winner.user.username?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-bold text-white truncate">@{winner.user.username}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">{moodEmojis[winner.mood] || "🎬"}</span>
              <span className="text-[10px] sm:text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                {winner.mood}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Heart size={16} className="text-red-400 fill-red-400/20 sm:size-[18px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
