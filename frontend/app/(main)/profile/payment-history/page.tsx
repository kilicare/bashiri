"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";
import { getMyPaymentHistory } from "@/lib/api/payments";
import { CardSkeleton } from "@/components/ui/Skeleton";

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "#00FF87", PENDING: "#FFD600", FAILED: "#FF4757", CANCELLED: "#FF4757",
};

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getMyPaymentHistory().then(setData);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 px-5 pt-safe pt-6 pb-4">
        <button onClick={() => router.back()}><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <h1 className="text-xl font-black text-white">Historia ya Malipo</h1>
      </div>

      {!data ? (
        <div className="px-4"><CardSkeleton /></div>
      ) : (
        <div className="px-4 space-y-6 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              Subscriptions Zangu
            </p>
            {data.subscriptions.length === 0 ? (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Bado hujawahi kuwa PRO.</p>
            ) : (
              <div className="space-y-2">
                {data.subscriptions.map((s: any) => (
                  <div key={s.id} className="rounded-2xl p-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Crown size={14} style={{ color: s.is_active ? "#FFD600" : "rgba(255,255,255,0.3)" }} />
                        <span className="text-sm font-bold text-white">{s.plan === "weekly" ? "Wiki 1" : "Mwezi 1"}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: "#00FF87" }}>TZS {s.amount_tzs.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {new Date(s.starts_at).toLocaleDateString("sw-TZ")} — {new Date(s.ends_at).toLocaleDateString("sw-TZ")}
                      {s.is_active && <span style={{ color: "#00FF87" }}> • Active</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              Miamala Yote
            </p>
            {data.transactions.length === 0 ? (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Hakuna miamala bado.</p>
            ) : (
              <div className="space-y-2">
                {data.transactions.map((t: any) => (
                  <div key={t.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <p className="text-sm font-bold text-white">{t.plan === "weekly" ? "Wiki 1" : "Mwezi 1"}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{new Date(t.created_at).toLocaleString("sw-TZ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: "#00FF87" }}>TZS {t.amount_tzs.toLocaleString()}</p>
                      <span className="text-[10px] font-bold" style={{ color: STATUS_COLORS[t.status] }}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
