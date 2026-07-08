"use client";
import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/api/admin";

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "#00FF87", PENDING: "#FFD600", FAILED: "#FF4757", CANCELLED: "#FF4757",
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    getTransactions({ status: statusFilter || undefined }).then((data) => setTransactions(data.results));
  }, [statusFilter]);

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-4">Malipo</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "SUCCESS", "PENDING", "FAILED"].map((s) => (
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

      <div className="rounded-2xl overflow-hidden -mx-4 px-4 md:mx-0 md:px-0" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] md:min-w-full w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Username</th>
                <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Plan</th>
                <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Kiasi</th>
                <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Status</th>
                <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Tarehe</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-white">{t.username?.[0]?.toUpperCase() || "?"}</span>
                        )}
                      </div>
                      <span className="text-white font-bold">@{t.username || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>{t.plan}</td>
                  <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>TZS {t.amount_tzs.toLocaleString()}</td>
                  <td className="px-4 py-3"><span style={{ color: STATUS_COLORS[t.status] }}>{t.status}</span></td>
                  <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.4)" }}>{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
