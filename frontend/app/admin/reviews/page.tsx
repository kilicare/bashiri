"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Trash2, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { getAdminReviews, deleteAdminReview, bulkDeleteAdminReviews } from "@/lib/api/admin";

interface Review {
  id: number;
  user: number;
  username: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const data = await getAdminReviews();
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reviewId: number) {
    setDeletingId(reviewId);
    try {
      await deleteAdminReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error("Failed to delete review:", error);
    } finally {
      setDeletingId(null);
    }
  }

  function toggleReviewSelection(reviewId: number) {
    setSelectedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  }

  async function handleBulkDelete() {
    if (selectedReviews.size === 0) return;

    setBulkDeleting(true);
    try {
      await bulkDeleteAdminReviews(Array.from(selectedReviews));
      setReviews(prev => prev.filter(r => !selectedReviews.has(r.id)));
      setSelectedReviews(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Failed to bulk delete reviews:", error);
    } finally {
      setBulkDeleting(false);
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        fill={i < rating ? "#D4AF37" : "none"}
        style={{ color: i < rating ? "#D4AF37" : "rgba(255,255,255,0.3)" }}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-white">Inapakia...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4" style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white">Reviews za Watumiaji</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(212, 175, 55, 0.2)" }}>
            <span className="text-sm font-bold" style={{ color: "#D4AF37" }}>{reviews.length}</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Reviews</span>
          </div>
        </div>
      </div>

      {/* Selection controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setSelectionMode(!selectionMode)}
          className="text-sm font-bold px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: selectionMode ? "rgba(212, 175, 55, 0.2)" : "rgba(255,255,255,0.05)",
            color: selectionMode ? "#D4AF37" : "rgba(255,255,255,0.6)",
            border: selectionMode ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)"
          }}
        >
          {selectionMode ? "Cancel Selection" : "Select Reviews"}
        </button>

        {selectionMode && selectedReviews.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="text-sm font-bold px-4 py-1.5 rounded-lg transition-all flex items-center gap-2"
            style={{
              background: bulkDeleting ? "rgba(212, 175, 55, 0.1)" : "#D4AF37",
              color: bulkDeleting ? "rgba(212, 175, 55, 0.5)" : "#000"
            }}
          >
            {bulkDeleting ? (
              <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete {selectedReviews.size} Review{selectedReviews.size !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <AlertTriangle size={48} style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            Hakuna reviews bado
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-2xl p-4 transition-all ${selectionMode ? 'cursor-pointer' : ''}`}
              style={{ background: "#111111", border: selectedReviews.has(review.id) ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.06)" }}
              onClick={() => selectionMode && toggleReviewSelection(review.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {selectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReviewSelection(review.id);
                      }}
                      className="mt-1"
                    >
                      {selectedReviews.has(review.id) ? (
                        <CheckSquare size={20} style={{ color: "#D4AF37" }} />
                      ) : (
                        <Square size={20} style={{ color: "rgba(255,255,255,0.4)" }} />
                      )}
                    </button>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-white">@{review.username}</span>
                      <div className="flex gap-0.5">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {review.review_text}
                    </p>
                  </div>
                </div>
                {!selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(review.id);
                    }}
                    disabled={deletingId === review.id}
                    className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {deletingId === review.id ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Trash2 size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
                    )}
                  </button>
                )}
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {new Date(review.created_at).toLocaleDateString('sw-TZ', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
