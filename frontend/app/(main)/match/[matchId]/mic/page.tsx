"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMicReactions, getMoodSummary, canPost, getFanOfMatch, MicReaction } from "@/lib/api/mic";
import { MicReactionPlayer } from "@/components/mic/MicReactionPlayer";
import { BashiriButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Mic } from "lucide-react";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const MOOD_LABELS: Record<string, { emoji: string; color: string }> = {
  FUNNY: { emoji: "😂", color: "#FFD600" },
  FIRE: { emoji: "🔥", color: "#FF4757" },
  ANGRY: { emoji: "😡", color: "#FF4757" },
  RESPECT: { emoji: "👏", color: "#00FF87" },
  SHOCK: { emoji: "🤯", color: "#3B82F6" },
  PAIN: { emoji: "💔", color: "rgba(255,255,255,0.5)" },
};

export default function BashiriMicPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const { requireAuth } = useRequireAuth();

  const [reactions, setReactions] = useState<MicReaction[]>([]);
  const [teamFilter, setTeamFilter] = useState<"ALL" | "HOME" | "AWAY">("ALL");
  const [moodSummary, setMoodSummary] = useState<{ total: number; breakdown: Record<string, number> } | null>(null);
  const [canPostNow, setCanPostNow] = useState(false);
  const [loading, setLoading] = useState(true);

  function handlePostClick() {
    if (!requireAuth("Post video yako — kuwa nyota wa Bashiri Mic!")) return;
    router.push(`/match/${matchId}/mic/record`);
  }

  useEffect(() => {
    Promise.all([
      getMicReactions(matchId, teamFilter === "ALL" ? undefined : teamFilter),
      getMoodSummary(matchId),
      canPost(matchId),
    ]).then(([reactionsData, moodData, postData]) => {
      setReactions(reactionsData);
      setMoodSummary(moodData);
      setCanPostNow(postData.can_post);
      setLoading(false);
    });
  }, [matchId, teamFilter]);

  if (loading) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div>
        <div className="px-5 pt-safe pt-6 pb-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Mic size={20} style={{ color: "#00FF87" }} /> Bashiri Mic
          </h1>
          <BashiriButton size="md" onClick={handlePostClick}>
            🎤 Post
          </BashiriButton>
        </div>

        <MatchHubTabs matchId={matchId} active="mic" />

        {moodSummary && moodSummary.total > 0 && (
          <div className="px-5 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Match Mood</p>
            <div className="flex gap-2">
              {Object.entries(moodSummary.breakdown).filter(([, pct]) => pct > 0).map(([mood, pct]) => (
                <div key={mood} className="flex-1 rounded-xl p-2 text-center" style={{ background: "#111111" }}>
                  <p className="text-lg">{MOOD_LABELS[mood]?.emoji}</p>
                  <p className="text-xs font-bold" style={{ color: MOOD_LABELS[mood]?.color }}>{pct}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 flex gap-2 mb-4">
          {(["ALL", "HOME", "AWAY"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTeamFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: teamFilter === t ? "#00FF87" : "rgba(255,255,255,0.06)", color: teamFilter === t ? "#000" : "rgba(255,255,255,0.5)" }}
            >
              {t === "ALL" ? "Wote" : t === "HOME" ? "🔵 Home Fans" : "🟢 Away Fans"}
            </button>
          ))}
        </div>

        <div className="px-4 md:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {reactions.length === 0 ? (
            <p className="col-span-full text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>
              Hakuna reactions bado. {canPostNow && "Kuwa wa kwanza kupost!"}
            </p>
          ) : (
            reactions.map((r) => <MicReactionPlayer key={r.id} reaction={r} />)
          )}
        </div>
      </div>
    </DerbyThemeProvider>
  );
}