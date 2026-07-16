"use client";
import { useState } from "react";
import { MicReaction, voteOnReaction } from "@/lib/api/mic";
import { ReportButton } from "@/components/report/ReportButton";
import { MoreVertical } from "lucide-react";

const MOOD_EMOJI: Record<string, string> = {
  FUNNY: "😂", FIRE: "🔥", ANGRY: "😡", RESPECT: "👏", SHOCK: "🤯", PAIN: "💔",
};
const REACTIONS = [
  { key: "LAUGH", emoji: "😂" }, { key: "FIRE", emoji: "🔥" }, { key: "CLAP", emoji: "👏" },
  { key: "HUNDRED", emoji: "💯" }, { key: "ROFL", emoji: "🤣" },
];

export function MicReactionFullView({ reaction }: { reaction: MicReaction }) {
  const [voted, setVoted] = useState(reaction.user_voted);
  const [voteCount, setVoteCount] = useState(reaction.vote_count);
  const [voteBreakdown, setVoteBreakdown] = useState(reaction.vote_breakdown || {});
  const [showMenu, setShowMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'menu' | null>(null);

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
    <div className="snap-start relative bg-black" style={{ height: '100svh', paddingBottom: 'env(safe-area-inset-bottom)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Full screen video */}
      <video 
        src={reaction.video_url} 
        controls 
        className="w-full h-full object-cover"
        style={{ height: '100svh' }}
      />

      {/* Fan of match badge */}
      {reaction.is_fan_of_match && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-black z-20" style={{ background: "#FFD600", color: "#000" }}>
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

        {/* Three action buttons after last emoji */}
        <div className="flex flex-col gap-3 mt-2">
          {/* More options button */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'menu' ? null : 'menu')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 transition-all hover:bg-white/30"
            title="More options"
          >
            <MoreVertical size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Combined dropdown menu */}
      {activeMenu === 'menu' && (
        <div className="absolute right-16 bottom-20 bg-black/90 backdrop-blur-sm rounded-2xl p-3 z-30 border border-white/10">
          <button
            onClick={() => handleShare('whatsapp')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-white text-sm"
          >
            <span className="text-lg">📱</span>
            <span>WhatsApp</span>
          </button>
          <button
            onClick={() => handleShare('telegram')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-white text-sm"
          >
            <span className="text-lg">✈️</span>
            <span>Telegram</span>
          </button>
          <div className="border-t border-white/10 my-2"></div>
          <div className="px-4 py-3">
            <ReportButton contentType="MIC_REACTION" objectId={reaction.id} />
          </div>
        </div>
      )}

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
