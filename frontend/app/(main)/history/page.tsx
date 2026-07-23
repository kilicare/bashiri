"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { MicVideoCard } from "@/components/mic/MicVideoCard";
import { getUserMicReactions, deleteMicReaction, MicReaction } from "@/lib/api/mic";
import { motion, AnimatePresence } from "framer-motion";
import { Film, RefreshCw, Plus } from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const { requireAuth, hasHydrated } = useRequireAuth();
  const [reactions, setReactions] = useState<MicReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    
    if (!requireAuth("Fungua dashboard yako ya Mic videos — jisajili kwa dakika chache!")) {
      router.push("/home");
      return;
    }
    loadReactions();
  }, [requireAuth, router, hasHydrated]);

  const loadReactions = async () => {
    try {
      setLoading(true);
      const data = await getUserMicReactions();
      setReactions(data);
    } catch (error) {
      console.error("Failed to load reactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reactionId: number) => {
    try {
      setDeleting(reactionId);
      await deleteMicReaction(reactionId);
      setReactions(prev => prev.filter(r => r.id !== reactionId));
    } catch (error) {
      console.error("Failed to delete reaction:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh px-5 pt-safe pt-10 pb-4 flex items-center justify-center" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="text-center">
          <RefreshCw size={48} className="text-white/30 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Inapakia video zako...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-5 pt-safe pt-10 pb-24" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center">
            <Film size={20} className="text-black" />
          </div>
          <h1 className="text-2xl font-black text-white">Video Zangu</h1>
        </div>
        <p className="text-sm text-white/50">
          Simamia na interact na video zote ulizopost kwenye Mic
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 border border-white/10">
          <p className="text-3xl font-black text-white mb-1">{reactions.length}</p>
          <p className="text-xs text-white/50">Video Zilizopost</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 border border-white/10">
          <p className="text-3xl font-black text-white mb-1">
            {reactions.reduce((sum, r) => sum + r.vote_count, 0)}
          </p>
          <p className="text-xs text-white/50">Jumla ya Votes</p>
        </div>
      </div>

      {/* Empty State */}
      {reactions.length === 0 && (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-white/10 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Film size={40} className="text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Hakuna Video Bado</h3>
          <p className="text-sm text-white/50 mb-6">
            Bado hujapost video yoyote kwenye Mic. Anza sasa!
          </p>
          <button
            onClick={() => router.push("/matches")}
            className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            <span>Pata Video Mpya</span>
          </button>
        </div>
      )}

      {/* Video Grid */}
      <AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reactions.map((reaction) => (
            <MicVideoCard
              key={reaction.id}
              reaction={reaction}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
