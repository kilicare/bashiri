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
    <div className="min-h-dvh pb-safe" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5 md:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-safe pt-8 pb-6">
          <button
            type="button"
            aria-label="Open notifications"
            onClick={() => router.push("/notifications")}
            className="relative grid place-items-center rounded-2xl p-4 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Bell size={24} style={{ color: "var(--brand-primary)" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-1.5 text-xs font-bold transition-all duration-300 hover:scale-110"
                style={{ background: "var(--danger)", color: "var(--text-primary)", boxShadow: "0 0 16px var(--danger)" }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-accent)", letterSpacing: "-0.02em" }}>BASHIRI</h1>
          <PulseIndicatorButton />
        </div>
        <div className="pb-8">
          <HeroCarousel />
        </div>
        <FeedContainer />
      </div>
    </div>
  );
}