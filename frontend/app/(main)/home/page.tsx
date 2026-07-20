"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { PulseIndicatorButton } from "@/components/pulse/PulseIndicatorButton";
import { getNotifications } from "@/lib/api/notifications";
import { useAuthStore } from "@/stores/auth.store";
import { Bell } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);

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
    <div>
      <div className="flex items-center justify-between px-5 pt-safe pt-6 pb-2">
        <button
          type="button"
          aria-label="Open notifications"
          onClick={() => router.push("/notifications")}
          className="relative grid place-items-center rounded-2xl p-3 transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95"
          style={{ background: "linear-gradient(135deg, rgba(192,192,192,0.15), rgba(169,169,169,0.08))", border: "1px solid rgba(192,192,192,0.25)" }}
        >
          <Bell size={22} style={{ color: "#D4AF37" }} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 text-xs font-bold transition-all duration-300 hover:scale-110"
              style={{ background: "linear-gradient(135deg, var(--danger), #dc2626)", color: "white", boxShadow: "0 0 12px rgba(239,68,68,0.4)" }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--brand-accent)" }}>BASHIRI</h1>
        <PulseIndicatorButton />
      </div>
      <HeroCarousel />
      <FeedContainer />
    </div>
  );
}