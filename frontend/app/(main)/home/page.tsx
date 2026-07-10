"use client";

import { DerbyBanner } from "@/components/derby/DerbyBanner";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { PremiumCard } from "@/components/ui/GlassCard";
import { PremiumBadge } from "@/components/ui/Badge";
import { Bell, Search, TrendingUp, Award, Zap } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getNotifications } from "@/lib/api/notifications";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const accuracy = user?.accuracy_percentage || 0;
  const winStreak = user?.current_streak || 0;
  const totalPicks = user?.total_predictions || 0;
  const bestStreak = user?.best_streak || 0;

  useEffect(() => {
    if (user) {
      getNotifications().then((notifications) => {
        if (notifications) {
          const unread = notifications.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        }
      }).catch(() => {
        // Silently fail for guest users
      });
    }
  }, [user]);

  return (
    <div className="min-h-dvh bg-[#050508] pb-24">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-6 pb-4 animate-fadeIn">
        <button 
          onClick={() => router.push("/notifications")}
          className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-110"
        >
          <Bell size={20} className="text-gradient-to-r from-[#F5A623] to-[#E8892A]" style={{ color: "#F5A623" }} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#F5A623] to-[#E8892A] rounded-full flex items-center justify-center text-xs font-bold text-black">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
          <span className="text-white">BASHIRI</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#E8892A]">.AI</span>
        </h1>
        <button 
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-110"
          aria-label="Tafuta"
        >
          <Search size={20} className="text-white/60" />
        </button>
      </div>

      {/* Hero Stats Section */}
      <div className="px-5 mb-6 animate-slideUp">
        <PremiumCard variant="gradient" className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs font-medium mb-1">Your Accuracy</p>
              <p className="text-4xl font-black text-white">{accuracy}%</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F5A623]/20 to-[#E8892A]/10 flex items-center justify-center">
              <TrendingUp size={32} className="text-[#F5A623]" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-white/5 rounded-2xl p-3">
              <p className="text-white/40 text-xs mb-1">Win Streak</p>
              <p className="text-xl font-bold text-white">{winStreak}</p>
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl p-3">
              <p className="text-white/40 text-xs mb-1">Total Picks</p>
              <p className="text-xl font-bold text-white">{totalPicks}</p>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Quick Stats Row */}
      <div className="px-5 mb-6 animate-slideUp" style={{ animationDelay: "100ms" }}>
        <div className="grid grid-cols-3 gap-3">
          <PremiumCard hover className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
              <Award size={20} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">Top 5%</p>
            <p className="text-white/40 text-xs">Ranking</p>
          </PremiumCard>
          <PremiumCard hover className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
              <Zap size={20} className="text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{bestStreak}</p>
            <p className="text-white/40 text-xs">Best Streak</p>
          </PremiumCard>
          <PremiumCard hover className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#F5A623]/20 to-[#E8892A]/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-[#F5A623]" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{accuracy}%</p>
            <p className="text-white/40 text-xs">Accuracy</p>
          </PremiumCard>
        </div>
      </div>

      {/* Section Header */}
      <div className="px-5 mb-4 flex items-center justify-between animate-slideUp" style={{ animationDelay: "200ms" }}>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Today's Picks</h2>
          <p className="text-white/50 text-sm">AI-powered predictions</p>
        </div>
        <PremiumBadge variant="gold">Live</PremiumBadge>
      </div>

      {/* Derby Banner */}
      <div className="animate-slideUp" style={{ animationDelay: "250ms" }}>
        <DerbyBanner />
      </div>

      {/* Feed Container */}
      <div className="animate-slideUp" style={{ animationDelay: "300ms" }}>
        <FeedContainer />
      </div>
    </div>
  );
}