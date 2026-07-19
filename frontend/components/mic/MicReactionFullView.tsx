"use client";
import { useState, useRef, useEffect } from "react";
import { MicReaction, voteOnReaction } from "@/lib/api/mic";
import { ReportButton } from "@/components/report/ReportButton";
import { Play, Pause } from "lucide-react";

const MOOD_EMOJI: Record<string, string> = {
  FUNNY: "😂", FIRE: "🔥", ANGRY: "😡", RESPECT: "👏", SHOCK: "🤯", PAIN: "💔",
};
const REACTIONS = [
  { key: "LAUGH", emoji: "😂" }, { key: "FIRE", emoji: "🔥" }, { key: "CLAP", emoji: "👏" },
  { key: "HUNDRED", emoji: "💯" }, { key: "ROFL", emoji: "🤣" },
];

export function MicReactionFullView({ reaction, isInView, onInView }: { 
  reaction: MicReaction; 
  isInView: boolean;
  onInView: (id: number) => void;
}) {
  const [voted, setVoted] = useState(reaction.user_voted);
  const [voteCount, setVoteCount] = useState(reaction.vote_count);
  const [voteBreakdown, setVoteBreakdown] = useState(reaction.vote_breakdown || {});
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // TikTok-like auto-play behavior
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      // Play current video
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log("Auto-play prevented:", err));
      onInView(reaction.id);
    } else {
      // Pause when not in view
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isInView, reaction.id, onInView]);

  // Handle play/pause toggle
  function togglePlayPause() {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  }

  async function handleReact(emoji: string) {
    if (voted) return;
    await voteOnReaction(reaction.id, emoji);
    setVoted(true);
    setVoteCount((prev) => prev + 1);
    setVoteBreakdown((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }));
  }

  function handleShare(platform: 'whatsapp' | 'telegram') {
    const shareText = `🏆 Angalia video hii ya @${reaction.username} kwenye Bashiri AI! ${MOOD_EMOJI[reaction.mood]}\n\n🔥 Vote zaidi ya ${voteCount}!\n\n👉 Tazama hapa: ${window.location.href}`;
    const encodedText = encodeURIComponent(shareText);
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`, '_blank');
    }
  }

  return (
    <div 
      className="snap-start relative bg-black" 
      style={{ height: '100svh', paddingBottom: 'env(safe-area-inset-bottom)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      data-reaction-id={reaction.id}
    >
      {/* Full screen video */}
      <video 
        ref={videoRef}
        src={reaction.video_url} 
        loop
        playsInline
        onClick={togglePlayPause}
        className="w-full h-full object-cover cursor-pointer"
        style={{ height: '100svh' }}
      />

      {/* Play/Pause button */}
      <button
        onClick={togglePlayPause}
        className="absolute top-16 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all hover:bg-black/70 z-20"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
      </button>

      {/* Fan of match badge */}
      {reaction.is_fan_of_match && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-black z-20" style={{ background: "var(--brand-primary)", color: "#000" }}>
          🏆 FAN OF THE MATCH
        </div>
      )}

      {/* 5 Reactions on RIGHT side */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-4 z-20">
        {REACTIONS.map((r) => (
          <div key={r.key} className="flex flex-col items-center gap-1">
            <button 
              onClick={() => handleReact(r.key)} 
              disabled={voted}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 transition-all hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">{r.emoji}</span>
            </button>
            <span className="text-white text-xs font-bold">{voteBreakdown[r.key] || 0}</span>
          </div>
        ))}

        {/* Report flag button */}
        <div className="flex justify-center">
          <ReportButton contentType="MIC_REACTION" objectId={reaction.id} />
        </div>
      </div>

      {/* User info and mood on LEFT side at bottom */}
      <div className="absolute left-4 bottom-20 right-20 z-60">
        <div className="flex items-center gap-3">
          {reaction.avatar_url ? (
            <img 
              src={reaction.avatar_url} 
              alt={reaction.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
              {reaction.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-sm">@{reaction.username}</p>
            <span className="text-2xl">{MOOD_EMOJI[reaction.mood]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
