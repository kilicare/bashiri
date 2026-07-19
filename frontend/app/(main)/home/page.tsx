"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { getNotifications } from "@/lib/api/notifications";
import { useAuthStore } from "@/stores/auth.store";
import { Bell, Search } from "lucide-react";

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
          className="relative grid place-items-center rounded-2xl p-2 transition hover:bg-white/10"
        >
          <Bell size={22} style={{ color: "rgba(255,255,255,0.8)" }} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-5 rounded-full bg-[var(--danger)] text-[10px] font-bold text-white flex items-center justify-center px-1.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--brand-accent)" }}>BASHIRI</h1>
        <Search size={22} style={{ color: "rgba(255,255,255,0.6)" }} />
      </div>
      <HeroCarousel />
      <FeedContainer />
    </div>
  );
}