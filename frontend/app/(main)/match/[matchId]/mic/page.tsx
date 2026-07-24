"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getMicReactions, getMoodSummary, canPost, getFanOfMatch, MicReaction } from "@/lib/api/mic";
import { MicReactionPlayer } from "@/components/mic/MicReactionPlayer";
import { MicReactionFullView } from "@/components/mic/MicReactionFullView";
import { BashiriButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Mic, Clock, Grid, Maximize2, X } from "lucide-react";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { motion, AnimatePresence } from "framer-motion";

const MOOD_LABELS: Record<string, { emoji: string; color: string }> = {
  FUNNY: { emoji: "😂", color: "var(--warning)" },
  FIRE: { emoji: "🔥", color: "var(--danger)" },
  ANGRY: { emoji: "😡", color: "var(--danger)" },
  RESPECT: { emoji: "👏", color: "var(--success)" },
  SHOCK: { emoji: "🤯", color: "var(--info)" },
  PAIN: { emoji: "💔", color: "rgba(255,255,255,0.5)" },
};

export default function BashiriMicPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = Number(params.matchId);
  const { requireAuth } = useRequireAuth();

  const [reactions, setReactions] = useState<MicReaction[]>([]);
  const [teamFilter, setTeamFilter] = useState<"ALL" | "HOME" | "AWAY">("ALL");
  const [moodSummary, setMoodSummary] = useState<{ total: number; breakdown: Record<string, number> } | null>(null);
  const [canPostNow, setCanPostNow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWaitModal, setShowWaitModal] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"grid" | "full">("grid");
  const [visibleReactionId, setVisibleReactionId] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleIdsRef = useRef<Set<number>>(new Set());

  // Initialize layoutMode from URL param
  useEffect(() => {
    if (searchParams.get("mode") === "full") {
      setLayoutMode("full");
    }
  }, [searchParams]);

  // Update URL when switching layout modes
  useEffect(() => {
    if (layoutMode === "full") {
      router.replace(`/match/${matchId}/mic?mode=full`);
    } else {
      router.replace(`/match/${matchId}/mic`);
    }
  }, [layoutMode, matchId, router]);

  function handlePostClick() {
    if (!requireAuth("Post video yako — kuwa nyota wa Bashiri Mic!")) return;
    
    if (!canPostNow) {
      setShowWaitModal(true);
      return;
    }
    
    router.push(`/match/${matchId}/mic/record`);
  }

  // Intersection Observer for TikTok-like scroll behavior
  const handleInView = useCallback((id: number) => {
    setVisibleReactionId(id);
  }, []);

  useEffect(() => {
    if (layoutMode !== "full" || reactions.length === 0) return;

    // Set up Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const reactionId = parseInt(element.dataset.reactionId || "0");
            if (reactionId) {
              handleInView(reactionId);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.6 // Video must be 60% visible to be considered "in view"
      }
    );

    observerRef.current = observer;

    // Observe all video containers
    const videoContainers = document.querySelectorAll('[data-reaction-id]');
    videoContainers.forEach((container) => {
      observer.observe(container);
    });

    // Cleanup
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [layoutMode, reactions, handleInView]);

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

  if (loading) return <div className="px-4 pt-safe pt-10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}><CardSkeleton /></div>;

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div className={layoutMode === "full" ? "relative" : ""}>
        {layoutMode === "grid" && (
          <div className="px-5 pt-safe pt-10 pb-4 flex items-center justify-between" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Mic size={20} style={{ color: "var(--brand-accent)" }} /> Bashiri Mic
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayoutMode(layoutMode === "grid" ? "full" : "grid")}
                className="p-2 rounded-full transition-all"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                {layoutMode === "grid" ? <Maximize2 size={20} className="text-white" /> : <Grid size={20} className="text-white" />}
              </button>
              <BashiriButton size="md" onClick={handlePostClick}>
                🎤 Post
              </BashiriButton>
            </div>
          </div>
        )}

        {layoutMode === "full" && (
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
            <button
              onClick={() => setLayoutMode("grid")}
              className="p-2 rounded-full transition-all"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <Grid size={20} className="text-white" />
            </button>
            <BashiriButton size="md" onClick={handlePostClick}>
              🎤 Post
            </BashiriButton>
          </div>
        )}

        {layoutMode === "grid" && <MatchHubTabs matchId={matchId} active="mic" />}

        {layoutMode === "grid" && moodSummary && moodSummary.total > 0 && (
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

        {layoutMode === "grid" && (
          <div className="px-5 flex gap-2 mb-4">
            {(["ALL", "HOME", "AWAY"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTeamFilter(t)}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: teamFilter === t ? "var(--brand-accent)" : "rgba(255,255,255,0.06)", color: teamFilter === t ? "#000" : "rgba(255,255,255,0.5)" }}
              >
                {t === "ALL" ? "Wote" : t === "HOME" ? "🔵 Home Fans" : "🟢 Away Fans"}
              </button>
            ))}
          </div>
        )}

        {layoutMode === "grid" ? (
          <div className="px-4 md:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {reactions.length === 0 ? (
              <p className="col-span-full text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>
                Hakuna reactions bado. {canPostNow && "Kuwa wa kwanza kupost!"}
              </p>
            ) : (
              reactions.map((r) => <MicReactionPlayer key={r.id} reaction={r} />)
            )}
          </div>
        ) : (
          <div className="snap-y-mandatory overflow-y-scroll" style={{ height: '100svh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {reactions.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Hakuna reactions bado. {canPostNow && "Kuwa wa kwanza kupost!"}
                </p>
              </div>
            ) : (
              reactions.map((r) => (
                <MicReactionFullView 
                  key={r.id} 
                  reaction={r} 
                  isInView={visibleReactionId === r.id}
                  onInView={handleInView}
                />
              ))
            )}
          </div>
        )}

        <AnimatePresence>
          {showWaitModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
              onClick={() => setShowWaitModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-[#111] rounded-3xl p-6 border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Subiri Kidogo</h2>
                  <button
                    onClick={() => setShowWaitModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(34,197,94,0.1)" }}>
                    <Clock size={32} style={{ color: "var(--success)" }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Mechi Bado Haijaisha</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Subiri mechi iishe kabla ya kupost video yako. Tutakuarifu mara mechi itakapomalizika!
                  </p>
                </div>

                <BashiriButton
                  size="lg"
                  fullWidth
                  onClick={() => setShowWaitModal(false)}
                >
                  Sawa, Nimesikia
                </BashiriButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DerbyThemeProvider>
  );
}