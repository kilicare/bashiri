"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CalendarDays, Sparkles, Trophy, Plus } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState, useRef } from "react";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/matches", icon: CalendarDays, label: "Matches" },
  { href: "/ai", icon: Sparkles, label: "AI" },
  { href: "/tips", icon: Trophy, label: "Tips" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();

  // Premium hide/show behavior
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    let lastKnownScrollY = window.scrollY;
    const scrollThreshold = 10; // Minimum scroll distance to trigger
    const scrollDelay = 100; // Delay to prevent rapid toggling

    const handleScroll = () => {
      if (isScrolling.current) return;
      isScrolling.current = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = Math.abs(currentScrollY - lastKnownScrollY);

        // Only trigger if scroll exceeds threshold
        if (scrollDelta > scrollThreshold) {
          const isScrollingDown = currentScrollY > lastKnownScrollY;

          if (isScrollingDown && isVisible) {
            // Scrolling down - hide nav
            setIsVisible(false);
          } else if (!isScrollingDown && !isVisible) {
            // Scrolling up - show nav
            setIsVisible(true);
          }

          lastKnownScrollY = currentScrollY;
        }

        isScrolling.current = false;
      });
    };

    // Debounced scroll handler to prevent rapid toggling
    const debouncedScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(handleScroll, scrollDelay);
    };

    window.addEventListener("scroll", debouncedScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", debouncedScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isVisible]);

  const vibrate = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
  };

  function navigate(item: any) {
    if (item.requiresAuth && !requireAuth("Fungua Profile yako — jisajili kwa dakika chache!")) return;
    router.push(item.href);
  }

  function NavButton({ item }: { item: any }) {
    const isActive = pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <button
        onClick={() => navigate(item)}
        onTouchStart={vibrate}
        className="flex-1 flex flex-col items-center justify-center transition-all duration-200"
      >
        <div
          className="inline-flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200"
          style={{
            background: isActive ? "rgba(212,175,55,0.15)" : "transparent",
          }}
        >
          <Icon
            size={20}
            strokeWidth={2}
            className="transition-all duration-200"
            style={{
              color: isActive ? "var(--brand-primary)" : "rgba(255,255,255,0.9)",
              transform: isActive ? "scale(1.05)" : "scale(1)",
            }}
          />
          <span
            className="text-[10px] font-medium tracking-wide transition-all duration-200"
            style={{
              color: isActive ? "var(--brand-primary)" : "rgba(255,255,255,0.9)",
            }}
          >
            {item.label}
          </span>
        </div>
      </button>
    );
  }

  return (
    <motion.nav
      className="fixed bottom-4 left-0 right-0 z-30 px-4 pb-safe"
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1], // Smooth cubic-bezier easing
      }}
      style={{
        willChange: "transform", // GPU acceleration hint
      }}
    >
      <div
        className="max-w-lg mx-auto rounded-[32px]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-1 px-3 py-2.5">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavButton key={item.href} item={item} />
          ))}

          <motion.button
            onClick={() => {
              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate(12);
              }
              router.push("/create");
            }}
            onTouchStart={vibrate}
            className="w-14 h-14 rounded-full flex items-center justify-center -mt-6 mx-2 shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
              boxShadow: "0 8px 24px rgba(212,175,55,0.3), 0 0 0 3px #0B0B0B",
            }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05, boxShadow: "0 12px 32px rgba(212,175,55,0.4), 0 0 0 3px #0B0B0B" }}
            aria-label="Unda ubashiri mpya"
          >
            <Plus size={24} strokeWidth={2.5} style={{ color: "#051006" }} />
          </motion.button>

          {NAV_ITEMS.slice(2).map((item) => (
            <NavButton key={item.href} item={item} />
          ))}
        </div>
      </div>
    </motion.nav>
  );
}