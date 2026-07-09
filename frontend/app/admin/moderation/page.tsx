"use client";
import { useEffect, useState } from "react";
import { getMicReactionsAdmin, toggleMicReactionActive, getCards, getAdminContentReports } from "@/lib/api/admin";

export default function AdminModerationPage() {
  const [tab, setTab] = useState<"mic" | "user-predictions" | "reports">("mic");
  const [micReactions, setMicReactions] = useState<any[]>([]);
  const [userPredictionCards, setUserPredictionCards] = useState<any[]>([]);
  const [contentReports, setContentReports] = useState<any[]>([]);

  useEffect(() => {
    loadMic();
    loadUserPredictions();
    loadReports();
  }, []);

  function loadMic() {
    getMicReactionsAdmin().then(setMicReactions);
  }
  function loadUserPredictions() {
    getCards("USER_PREDICTION").then(setUserPredictionCards);
  }
  function loadReports() {
    getAdminContentReports().then(setContentReports);
  }

  async function handleToggleMic(id: number) {
    await toggleMicReactionActive(id);
    loadMic();
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-4">Content Moderation</h1>
      <div className="flex gap-2 mb-6">
        {(["mic", "user-predictions", "reports"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: tab === t ? "#00FF87" : "rgba(255,255,255,0.06)", color: tab === t ? "#000" : "rgba(255,255,255,0.5)" }}
          >
            {t === "mic" ? "Bashiri Mic Videos" : t === "user-predictions" ? "User Predictions" : "Content Reports"}
          </button>
        ))}
      </div>

      {tab === "mic" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {micReactions.map((r: any) => (
            <div key={r.id} className="rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <video src={r.video_url} className="w-full aspect-[9/16] object-cover" controls />
              <div className="p-3">
                <p className="text-xs font-bold text-white mb-1">@{r.username}</p>
                <p className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{r.mood} • {r.duration_seconds}s</p>
                <button
                  onClick={() => handleToggleMic(r.id)}
                  className="w-full py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: r.is_active ? "rgba(255,71,87,0.15)" : "rgba(0,255,135,0.15)", color: r.is_active ? "#FF4757" : "#00FF87" }}
                >
                  {r.is_active ? "Ficha Video" : "Rejesha Video"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "user-predictions" && (
        <div className="space-y-2">
          {userPredictionCards.map((c: any) => (
            <div key={c.id} className="rounded-2xl p-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm font-bold text-white">@{c.data.username}: {c.data.selection}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{c.data.note}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-2">
          {contentReports.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna ripoti bado.</p>
          ) : (
            contentReports.map((r: any) => (
              <div key={r.id} className="rounded-2xl p-4" style={{ background: "#111111", border: "1px solid rgba(255,71,87,0.15)" }}>
                <p className="text-sm font-bold text-white">
                  @{r.reporter_username} aliripoti {r.content_type} #{r.object_id}
                </p>
                <p className="text-xs" style={{ color: "#FF4757" }}>{r.reason}</p>
                {r.note && <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>"{r.note}"</p>}
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            Ikiwa maudhui yameripotiwa mara 3+ na watumiaji tofauti, yanafichwa moja kwa moja
            na ticket inaundwa kwenye "Support" kwa uamuzi wako wa mwisho.
          </p>
        </div>
      )}
    </div>
  );
}
