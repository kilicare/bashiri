"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardStats } from "@/lib/api/admin";
import { Users, DollarSign, TrendingUp, Calendar, Radio, Clock, ArrowLeft } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  if (!stats) return <p style={{ color: "rgba(255,255,255,0.5)" }}>Inapakia...</p>;

  const CARDS = [
    { label: "Watumiaji Wote", value: stats.total_users, icon: Users, color: "var(--success)" },
    { label: "Subscribers Active", value: stats.total_subscribers, icon: TrendingUp, color: "var(--warning)" },
    { label: "Mapato Mwezi Huu", value: `TZS ${stats.revenue_this_month_tzs.toLocaleString()}`, icon: DollarSign, color: "var(--success)" },
    { label: "Mapato Yote", value: `TZS ${stats.revenue_all_time_tzs.toLocaleString()}`, icon: DollarSign, color: "var(--info)" },
    { label: "AI Accuracy", value: `${stats.ai_prediction_accuracy}%`, icon: TrendingUp, color: "var(--brand-accent)" },
    { label: "Mechi Leo", value: stats.matches_today, icon: Calendar, color: "var(--warning)" },
    { label: "Live Sasa", value: stats.live_matches_now, icon: Radio, color: "var(--danger)" },
    { label: "Malipo Yanayosubiri", value: stats.pending_transactions, icon: Clock, color: "var(--warning)" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} aria-label="Rudi nyuma">
          <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Icon size={20} style={{ color: c.color }} className="mb-3" />
              <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
