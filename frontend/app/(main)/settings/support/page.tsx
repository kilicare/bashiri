"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyTickets, SupportTicket } from "@/lib/api/support";
import { ArrowLeft, Plus } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#FFD600", IN_PROGRESS: "#3B82F6", RESOLVED: "#00FF87", CLOSED: "rgba(255,255,255,0.4)",
};
const TYPE_LABELS: Record<string, string> = {
  ACCOUNT_ISSUE: "Tatizo la Akaunti", PAYMENT_ISSUE: "Tatizo la Malipo",
  CONTENT_REPORT: "Ripoti ya Maudhui", BUG_REPORT: "Hitilafu ya App",
  FEEDBACK: "Maoni", OTHER: "Nyingine",
};

export default function SupportListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTickets().then((data) => { setTickets(data); setLoading(false); });
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-5 pt-safe pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Rudi nyuma"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
          <h1 className="text-xl font-black text-white">Msaada na Maoni</h1>
        </div>
        <button
          onClick={() => router.push("/settings/support/new")}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#00FF87" }}
          aria-label="Unda ticket mpya"
        >
          <Plus size={18} style={{ color: "#000" }} />
        </button>
      </div>

      <div className="px-4 space-y-2 pb-6">
        {loading ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : tickets.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>
            Huna ticket bado. Bonyeza + kuanzisha mazungumzo na timu yetu.
          </p>
        ) : (
          tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => router.push(`/settings/support/${t.id}`)}
              className="w-full text-left rounded-2xl p-4"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">{t.subject}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[t.status]}22`, color: STATUS_COLORS[t.status] }}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{TYPE_LABELS[t.type] || t.type}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
