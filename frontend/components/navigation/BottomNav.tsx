"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CalendarDays, Cpu, User2, Plus } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const LEFT_ITEMS = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/matches", icon: CalendarDays, label: "Matches" },
];
const RIGHT_ITEMS = [
  { href: "/ai", icon: Cpu, label: "AI" },
  { href: "/profile", icon: User2, label: "Profile", requiresAuth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();

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
        className="group flex flex-col items-center gap-1 px-2 py-1.5 rounded-3xl flex-1 transition-all duration-200"
        style={{
          background: isActive ? "rgba(212,175,55,0.12)" : "transparent",
        }}
      >
        <Icon
          size={20}
          strokeWidth={1.8}
          className="transition-all duration-200 group-hover:text-[var(--brand-primary)]"
          style={{
            color: isActive ? "var(--brand-primary)" : "rgba(255,255,255,0.55)",
            transition: "color 0.2s ease, transform 0.2s ease",
            transform: isActive ? "translateY(-1px) scale(1.03)" : "none",
          }}
        />
        <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 ${isActive ? "text-[var(--brand-primary)]" : "text-[rgba(255,255,255,0.42)] group-hover:text-[var(--brand-primary)]"}`}>
          {item.label}
        </span>
      </button>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 pb-safe"
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(22px)", borderTop: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 -10px 40px rgba(0,0,0,0.18)" }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 relative max-w-4xl mx-auto">
        {LEFT_ITEMS.map((item) => <NavButton key={item.href} item={item} />)}

        <motion.button
          onClick={() => {
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate(12);
            }
            router.push("/create");
          }}
          onTouchStart={vibrate}
          className="w-16 h-16 rounded-[26px] flex items-center justify-center -mt-7 mx-2 shrink-0"
          style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))", boxShadow: "0 14px 32px rgba(212,175,55,0.22)" }}
          whileTap={{ scale: 0.94 }}
          aria-label="Unda ubashiri mpya"
        >
          <Plus size={28} strokeWidth={2.4} style={{ color: "#051006" }} />
        </motion.button>

        {RIGHT_ITEMS.map((item) => <NavButton key={item.href} item={item} />)}
      </div>
    </nav>
  );
}