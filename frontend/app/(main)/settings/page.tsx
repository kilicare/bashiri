"use client";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

const SETTINGS_ITEMS = [
  { label: "Timu Ninazopenda", href: "/settings/teams" },
  { label: "Ligi Ninazopenda", href: "/settings/leagues" },
  { label: "Notifications", href: "/settings/notifications" },
  { label: "Lugha (SW/EN)", href: "/settings/language" },
  { label: "Msaada na Maoni", href: "/settings/support" },
];

export default function SettingsPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-5 pt-safe pt-6 pb-4"><h1 className="text-2xl font-black text-white">Settings</h1></div>
      <div className="px-4 space-y-2">
        {SETTINGS_ITEMS.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="w-full rounded-2xl p-4 flex items-center justify-between"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-sm font-bold text-white">{item.label}</span>
            <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}