"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, X, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

interface ReviewPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWriteReview: () => void;
}

export function ReviewPromptModal({ isOpen, onClose, onWriteReview }: ReviewPromptModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Check if user has already seen this modal
      const hasSeenReviewPrompt = localStorage.getItem('hasSeenReviewPrompt');
      if (hasSeenReviewPrompt) {
        onClose();
      }
    }
  }, [isOpen, onClose]);

  const handleDismiss = () => {
    localStorage.setItem('hasSeenReviewPrompt', 'true');
    onClose();
  };

  const handleWriteReview = () => {
    localStorage.setItem('hasSeenReviewPrompt', 'true');
    onWriteReview();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: "#111111", border: "1px solid rgba(212, 175, 55, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            >
              <X size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>

            {/* Icon */}
            <div className="flex flex-col items-center text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 20 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(212, 175, 55, 0.2)" }}
              >
                <MessageSquare size={36} style={{ color: "#D4AF37" }} />
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                Jisikie Huru Kuandika Review!
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                Umepata mechi gap kwa kutumia app yetu? Tushirikishe uzoefu wako ili tuweze kuboresha huduma zaidi.
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + star * 0.05 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all"
                >
                  <Star
                    size={32}
                    fill={star <= (hoveredRating || rating) ? "#D4AF37" : "none"}
                    style={{
                      color: star <= (hoveredRating || rating) ? "#D4AF37" : "rgba(255,255,255,0.3)"
                    }}
                  />
                </motion.button>
              ))}
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWriteReview}
                className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: "#D4AF37", color: "#000" }}
              >
                <MessageSquare size={18} />
                Andika Review Sasa
              </motion.button>
              
              <button
                onClick={handleDismiss}
                className="w-full py-3 rounded-xl font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}
              >
                Baadaye
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
