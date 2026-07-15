"use client";
import { useState } from "react";
import { MicReaction, voteOnReaction } from "@/lib/api/mic";
import { ReportButton } from "@/components/report/ReportButton";
import { Share2 } from "lucide-react";

const MOOD_EMOJI: Record<string, string> = {
  FUNNY: "😂", FIRE: "🔥", ANGRY: "😡", RESPECT: "👏", SHOCK: "🤯", PAIN: "💔",
};
const REACTIONS = [
  { key: "LAUGH", emoji: "😂" }, { key: "FIRE", emoji: "🔥" }, { key: "CLAP", emoji: "👏" },
  { key: "HUNDRED", emoji: "💯" }, { key: "ROFL", emoji: "🤣" },
];

export function MicReactionPlayer({ reaction }: { reaction: MicReaction }) {
  const [voted, setVoted] = useState(reaction.user_voted);
  const [voteCount, setVoteCount] = useState(reaction.vote_count);
  const [voteBreakdown, setVoteBreakdown] = useState(reaction.vote_breakdown || {});

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
    <div className="rounded-3xl overflow-hidden relative" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      {reaction.is_fan_of_match && (
        <div className="px-4 py-2 text-center text-xs font-black" style={{ background: "#FFD600", color: "#000" }}>
          🏆 FAN OF THE MATCH
        </div>
      )}
      <div className="relative">
        <video src={reaction.video_url} controls className="w-full aspect-[9/16] object-cover bg-black" />
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <button
            onClick={() => handleShare('whatsapp')}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20 backdrop-blur-sm transition-all hover:bg-green-500/30"
            title="Share to WhatsApp"
          >
            <Share2 size={14} className="text-green-400" />
          </button>
          <ReportButton contentType="MIC_REACTION" objectId={reaction.id} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {reaction.avatar_url ? (
              <img 
                src={reaction.avatar_url} 
                alt={reaction.username}
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                {reaction.username.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-sm font-bold text-white truncate max-w-[120px]">@{reaction.username}</p>
            <span className="text-xl">{MOOD_EMOJI[reaction.mood]}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              {voteCount}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {REACTIONS.map((r) => (
            <div key={r.key} className="flex flex-col items-center gap-1">
              <button 
                onClick={() => handleReact(r.key)} 
                disabled={voted}
                className="text-xl p-1.5 rounded-xl transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {r.emoji}
              </button>
              <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                {voteBreakdown[r.key] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}