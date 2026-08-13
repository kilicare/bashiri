"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Trash2, AlertTriangle } from "lucide-react";

interface Review {
  id: number;
  user: number;
  username: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at: string;
}

async function adminFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  const token = localStorage.getItem("admin_access");
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const data = await adminFetch<Review[]>("/reviews/admin/");
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reviewId: number) {
    if (!confirm("Una uhakika unataka kufuta review hii?")) return;
    
    setDeletingId(reviewId);
    try {
      await adminFetch(`/reviews/admin/${reviewId}/`, { method: "DELETE" });
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error("Failed to delete review:", error);
    } finally {
      setDeletingId(null);
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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(212, 175, 55, 0.2)" }}>
          <span className="text-sm font-bold" style={{ color: "#D4AF37" }}>{reviews.length}</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Reviews</span>
        </div>
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
              className="rounded-2xl p-4 transition-all"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start justify-between mb-3">
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
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deletingId === review.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Trash2 size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
                  )}
                </button>
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
