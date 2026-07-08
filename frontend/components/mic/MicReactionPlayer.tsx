"use client";
import { useState } from "react";
import { MicReaction, voteOnReaction } from "@/lib/api/mic";

const MOOD_EMOJI: Record<string, string> = {
  FUNNY: "😂", FIRE: "🔥", ANGRY: "😡", RESPECT: "👏", SHOCK: "🤯", PAIN: "💔",
};
const REACTIONS = [
  { key: "LAUGH", emoji: "😂" }, { key: "FIRE", emoji: "🔥" }, { key: "CLAP", emoji: "👏" },
  { key: "HUNDRED", emoji: "💯" }, { key: "ROFL", emoji: "🤣" },
];

export function MicReactionPlayer({ reaction }: { reaction: MicReaction }) {
  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(reaction.vote_count);

  async function handleReact(emoji: string) {
    if (voted) return;
    await voteOnReaction(reaction.id, emoji);
    setVoted(true);
    setVoteCount((prev) => prev + 1);
  }

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      {reaction.is_fan_of_match && (
        <div className="px-4 py-2 text-center text-xs font-black" style={{ background: "#FFD600", color: "#000" }}>
          🏆 FAN OF THE MATCH
        </div>
      )}
      <video src={reaction.video_url} controls className="w-full aspect-[9/16] object-cover bg-black" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white">@{reaction.username}</p>
          <span className="text-lg">{MOOD_EMOJI[reaction.mood]}</span>
        </div>
        <div className="flex items-center gap-2">
          {REACTIONS.map((r) => (
            <button key={r.key} onClick={() => handleReact(r.key)} disabled={voted} className="text-lg">
              {r.emoji}
            </button>
          ))}
          <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{voteCount}</span>
        </div>
      </div>
    </div>
  );
}