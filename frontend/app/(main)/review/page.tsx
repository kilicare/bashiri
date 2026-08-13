"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { createReview } from "@/lib/api/reviews";

export default function ReviewPage() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !review.trim()) return;
    
    setSubmitting(true);
    try {
      await createReview(rating, review.trim());
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0a0a0a" }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0, 255, 135, 0.2)" }}
          >
            <CheckCircle size={40} style={{ color: "#00FF87" }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Asante Sana!
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            Review yako imewasilishwa kwa mafanikio. Tunashukuru kwa mchango wako!
          </p>
          <button
            onClick={() => router.push("/home")}
            className="w-full py-3 rounded-xl font-bold transition-all"
            style={{ background: "#D4AF37", color: "#000" }}
          >
            Rudi Nyumbani
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-xl font-bold text-white">Andika Review</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2 className="text-lg font-bold text-white mb-2">
            Je, Unavyopenda App Yetu?
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            Tafadhali pangi uzoefu wako kwa kutumia app ya Bashiri
          </p>

          {/* Star Rating */}
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-all"
              >
                <Star
                  size={40}
                  fill={star <= (hoveredRating || rating) ? "#D4AF37" : "none"}
                  style={{
                    color: star <= (hoveredRating || rating) ? "#D4AF37" : "rgba(255,255,255,0.3)"
                  }}
                />
              </motion.button>
            ))}
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-white mb-2">
              Review Yako
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Andika uzoefu wako hapa... Umepata mechi gap? Je, tunaweza kuboresha nini?"
              className="w-full px-4 py-3 rounded-xl text-white resize-none transition-all focus:outline-none focus:ring-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                minHeight: "150px"
              }}
              rows={6}
            />
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              {review.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || !review.trim() || submitting}
            className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#D4AF37", color: "#000" }}
          >
            {submitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : (
              <>
                <Send size={18} />
                Wasilisha Review
              </>
            )}
          </button>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.2)" }}
        >
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
            Review yako itatusaidia kuboresha app na kutoa mechi gap zaidi kwa watumiaji wote.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
