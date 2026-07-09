"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyPredictions, deleteMyPrediction } from "@/lib/api/feed";
import { Trash2, ChevronLeft } from "lucide-react";
import { BashiriButton } from "@/components/ui/Button";

export default function HistoryPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    try {
      const data = await getMyPredictions();
      setPredictions(data);
    } catch (error) {
      console.error("Failed to load predictions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(predictionId: number) {
    try {
      await deleteMyPrediction(predictionId);
      setPredictions(predictions.filter(p => p.id !== predictionId));
      setShowDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message || "Imeshindwa kufuta prediction");
    }
  }

  if (loading) {
    return (
      <div className="px-5 pt-safe pt-6 pb-4">
        <p className="text-center py-6" style={{ color: "rgba(255,255,255,0.4)" }}>Inapakia...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 pt-safe pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2" aria-label="Rudi nyuma">
          <ChevronLeft size={24} style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>
        <h1 className="text-2xl font-black text-white">Historia ya Predictions</h1>
      </div>

      <div className="px-4 space-y-3">
        {predictions.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Huna predictions bado. Anza kutabiri mechi!
            </p>
          </div>
        ) : (
          predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="rounded-2xl p-4"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(0,255,135,0.1)", color: "#00FF87" }}>
                      {prediction.market}
                    </span>
                    {prediction.emoji && <span className="text-lg">{prediction.emoji}</span>}
                  </div>
                  <p className="text-sm font-bold text-white mb-1">{prediction.selection}</p>
                  {prediction.note && (
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{prediction.note}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(prediction.id)}
                  className="p-2 rounded-full hover:bg-white/10"
                  style={{ color: "#FF4757" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {prediction.match_details && (
                <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex-1">
                    <p style={{ color: "rgba(255,255,255,0.4)" }}>Mechi</p>
                    <p className="text-white font-bold">
                      {prediction.match_details.home_team?.name} vs {prediction.match_details.away_team?.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {prediction.match_details.league?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: "rgba(255,255,255,0.4)" }}>Status</p>
                    <p className="font-bold" style={{ 
                      color: prediction.is_correct === true ? "#00FF87" : 
                            prediction.is_correct === false ? "#FF4757" : 
                            "rgba(255,255,255,0.6)" 
                    }}>
                      {prediction.is_correct === true ? "Sahihi ✅" : 
                       prediction.is_correct === false ? "Makosa ❌" : 
                       "Inasubiri ⏳"}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                {new Date(prediction.created_at).toLocaleDateString('sw-KE', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          ))
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-lg font-black text-white mb-2">Futa Prediction?</h3>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
              Una uhakika unataka kufuta prediction hii? Hatua hii haiwezi kurudishwa.
            </p>
            <div className="flex gap-3 justify-end">
              <BashiriButton variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Ghairi
              </BashiriButton>
              <BashiriButton
                onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                style={{ background: "#FF4757", borderColor: "#FF4757" }}
              >
                Futa
              </BashiriButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
