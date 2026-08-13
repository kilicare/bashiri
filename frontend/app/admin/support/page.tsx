"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminTickets } from "@/lib/api/admin";
import { ArrowLeft } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#FFD600", IN_PROGRESS: "#3B82F6", RESOLVED: "#00FF87", CLOSED: "rgba(255,255,255,0.4)",
};

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    getAdminTickets({ status: statusFilter || undefined }).then(setTickets);
  }, [statusFilter]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} aria-label="Rudi nyuma">
          <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>
        <h1 className="text-2xl font-black text-white">Support Inbox</h1>
      </div>

      <div className="flex gap-2 mb-4">
        {["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: statusFilter === s ? "#00FF87" : "rgba(255,255,255,0.06)", color: statusFilter === s ? "#000" : "rgba(255,255,255,0.5)" }}
          >
            {s || "Zote"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Subject</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Type</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Mtumaji</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Status</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Tarehe</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t: any) => (
              <tr
                key={t.id}
                onClick={() => router.push(`/admin/support/${t.id}`)}
                className="cursor-pointer hover:bg-white/5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <td className="px-4 py-3 text-white font-bold">{t.subject}</td>
                <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>{t.type}</td>
                <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {t.user_username ? `@${t.user_username}` : (t.guest_phone || "Guest")}
                </td>
                <td className="px-4 py-3"><span style={{ color: STATUS_COLORS[t.status] }}>{t.status}</span></td>
                <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.4)" }}>{new Date(t.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
