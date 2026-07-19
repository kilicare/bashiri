"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Calendar, Sparkles, User, Plus } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const LEFT_ITEMS = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/matches", icon: Calendar, label: "Matches" },
];
const RIGHT_ITEMS = [
  { href: "/ai", icon: Sparkles, label: "AI" },
  { href: "/profile", icon: User, label: "Profile", requiresAuth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();

  function navigate(item: any) {
    if (item.requiresAuth && !requireAuth("Fungua Profile yako — jisajili kwa dakika chache!")) return;
    router.push(item.href);
  }

  function NavButton({ item }: { item: any }) {
    const isActive = pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <button onClick={() => navigate(item)} className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl flex-1">
        <Icon size={20} style={{
          color: isActive ? "var(--brand-primary)" : "rgba(255,255,255,0.4)",
          filter: isActive ? "drop-shadow(0 0 6px rgba(212,175,55,0.6))" : "none",
        }} />
        <span className="text-[10px] font-bold" style={{ color: isActive ? "var(--brand-primary)" : "rgba(255,255,255,0.35)" }}>
          {item.label}
        </span>
      </button>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 pb-safe"
      style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-around px-2 py-2 relative max-w-lg mx-auto">
        {LEFT_ITEMS.map((item) => <NavButton key={item.href} item={item} />)}

        <motion.button
          onClick={() => router.push("/create")}
          className="w-14 h-14 rounded-2xl flex items-center justify-center -mt-6 mx-2 shrink-0"
          style={{ background: "var(--brand-primary)", boxShadow: "0 8px 25px rgba(212,175,55,0.5)" }}
          whileTap={{ scale: 0.9 }}
          aria-label="Unda ubashiri mpya"
        >
          <Plus size={26} strokeWidth={2.8} style={{ color: "#051006" }} />
        </motion.button>

        {RIGHT_ITEMS.map((item) => <NavButton key={item.href} item={item} />)}
      </div>
    </nav>
  );
}