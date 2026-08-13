"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { PulseIndicatorButton } from "@/components/pulse/PulseIndicatorButton";
import { getNotifications } from "@/lib/api/notifications";
import { useAuthStore } from "@/stores/auth.store";
import { Bell, Target } from "lucide-react";
import { motion } from "framer-motion";
import { ReviewPromptModal } from "@/components/review/ReviewPromptModal";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    // Show review modal after 5 seconds if user hasn't seen it
    const hasSeenReviewPrompt = localStorage.getItem('hasSeenReviewPrompt');
    if (!hasSeenReviewPrompt) {
      const timer = setTimeout(() => {
        setShowReviewModal(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    getNotifications()
      .then((data) => {
        if (!active || !Array.isArray(data)) return;
        setUnreadCount(data.filter((notification) => !notification.is_read).length);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="min-h-dvh pb-safe">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5 md:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-safe pt-12 pb-6 gap-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
          <button
            type="button"
            aria-label="Open notifications"
            onClick={() => router.push("/notifications")}
            className="relative grid place-items-center rounded-xl p-3 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Bell size={20} style={{ color: "var(--brand-primary)" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 text-[10px] font-bold transition-all duration-300 hover:scale-110"
                style={{ background: "var(--danger)", color: "var(--text-primary)", boxShadow: "0 0 10px var(--danger)" }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <h1 className="text-2xl font-bold tracking-tight flex-1 text-center" style={{ color: "var(--brand-accent)", letterSpacing: "-0.02em" }}>BASHIRI</h1>
          <motion.button
            type="button"
            aria-label="Go to Pulse"
            onClick={() => router.push("/pulse")}
            className="relative grid place-items-center rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(0,200,120,0.2), rgba(0,200,120,0.08))",
              border: "1.5px solid rgba(0,200,120,0.4)",
              boxShadow: "0 4px 20px rgba(0,200,120,0.3), 0 0 0 1px rgba(0,200,120,0.1)",
            }}
            whileHover={{ scale: 1.08, boxShadow: "0 6px 30px rgba(0,200,120,0.5), 0 0 0 1px rgba(0,200,120,0.2)" }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 4px 20px rgba(0,200,120,0.3), 0 0 0 1px rgba(0,200,120,0.1)",
                "0 4px 30px rgba(0,200,120,0.5), 0 0 0 1px rgba(0,200,120,0.2)",
                "0 4px 20px rgba(0,200,120,0.3), 0 0 0 1px rgba(0,200,120,0.1)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Pulse Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{
                background: "radial-gradient(circle, rgba(0,200,120,0.3) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <Target size={20} style={{ color: "#00C878" }} />

            {/* LIVE Badge */}
            <motion.div
              className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(0,200,120,0.9)",
                border: "1px solid rgba(0,200,120,0.3)",
                boxShadow: "0 0 10px rgba(0,200,120,0.6)",
              }}
              animate={{
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="text-[8px] font-bold text-white tracking-wider">LIVE</span>
            </motion.div>
          </motion.button>
        </div>
        <div className="pb-8">
          <HeroCarousel />
        </div>
        <FeedContainer />
      </div>

      {/* Review Prompt Modal */}
      <ReviewPromptModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onWriteReview={() => {
          setShowReviewModal(false);
          router.push("/review");
        }}
      />
    </div>
  );
}