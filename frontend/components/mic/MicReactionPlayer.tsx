"use client";
import { useState } from "react";
import { MicReaction, voteOnReaction } from "@/lib/api/mic";
import { ReportButton } from "@/components/report/ReportButton";

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

  async function handleReact(emoji: string) {
    if (voted) return;
    await voteOnReaction(reaction.id, emoji);
    setVoted(true);
    setVoteCount((prev) => prev + 1);
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
        <div className="absolute top-3 left-3 z-10">
          <ReportButton contentType="MIC_REACTION" objectId={reaction.id} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
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
            <button 
              key={r.key} 
              onClick={() => handleReact(r.key)} 
              disabled={voted}
              className="text-xl p-1.5 rounded-xl transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}