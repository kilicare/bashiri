"use client";
import { useEffect, useState } from "react";
import { getMLStatus } from "@/lib/api/admin";

export default function AdminMLStatusPage() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    getMLStatus().then(setStatus);
  }, []);

  if (!status) return <p style={{ color: "rgba(255,255,255,0.5)" }}>Inapakia...</p>;

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-4">ML Model Status</h1>

      {!status.loaded ? (
        <p style={{ color: "#FF4757" }}>Model haijapakiwa — hakikisha bashiri_prediction_models.json ipo.</p>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
            Ilifundishwa: {new Date(status.generated_at).toLocaleString()}
          </p>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(status.leagues).map(([league, info]: any) => (
              <div key={league} className="rounded-2xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-sm font-black text-white mb-2">{league}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Home Advantage: {info.home_advantage}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Timu: {info.team_count}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
