"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function HistoryPage() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();

  useEffect(() => {
    if (!requireAuth("Fungua historia yako ya predictions — jisajili kwa dakika chache!")) {
      router.push("/home");
      return;
    }
  }, [requireAuth, router]);

  return (
    <div className="px-5 pt-safe pt-6 pb-4">
      <div className="rounded-2xl p-6 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h1 className="text-xl font-black text-white mb-2">Historia ya Predictions</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Kipengele hiki kimeondolewa. Tazama Bashiri Track Record kwa utendaji wa AI.
        </p>
        <button
          onClick={() => router.push("/track-record")}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: "#00FF87", color: "#000" }}
        >
          Nenda kwa Track Record
        </button>
      </div>
    </div>
  );
}
