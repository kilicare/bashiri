"use client";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BashiriButton } from "@/components/ui/Button";
import { createUserPrediction } from "@/lib/api/feed";
import { Dashboard } from "@/lib/api/predictions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  dashboard: Dashboard;
  onShared: () => void;
}

const EMOJIS = ["🔥", "💪", "😤", "🤞", "😎"];

export function ShareSheet({ isOpen, onClose, matchId, dashboard, onShared }: Props) {
  const [marketKey, setMarketKey] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const market = dashboard.markets.find((m) => m.key === marketKey);

  function reset() {
    setMarketKey(null);
    setSelection(null);
    setNote("");
    setEmoji("🔥");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!marketKey || !selection) {
      setError("Chagua soko na jibu lako kwanza.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createUserPrediction({ match: matchId, market: marketKey, selection, note, emoji });
      onShared();
      handleClose();
    } catch (e: any) {
      setError(e.message || "Imeshindwa kutuma prediction.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Shiriki Prediction Yako">
      {!marketKey ? (
        <div className="space-y-2">
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            Chagua soko unalotaka kuweka maoni yako mwenyewe (si AI):
          </p>
          {dashboard.markets.map((m) => (
            <button
              key={m.key}
              onClick={() => setMarketKey(m.key)}
              className="w-full text-left rounded-xl px-4 py-3 text-sm font-bold text-white"
              style={{ background: "#151515", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {m.label}
            </button>
          ))}
        </div>
      ) : !selection ? (
        <div className="space-y-2">
          <button onClick={() => setMarketKey(null)} className="text-xs mb-2 block" style={{ color: "#00FF87" }}>
            ← Badilisha Soko
          </button>
          <p className="text-sm font-bold text-white mb-3">{market?.label}</p>
          {market?.options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelection(opt.key)}
              className="w-full text-left rounded-xl px-4 py-3 text-sm font-bold text-white"
              style={{ background: "#151515", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setSelection(null)} className="text-xs block" style={{ color: "#00FF87" }}>
            ← Badilisha Jibu
          </button>

          <div className="rounded-xl p-3" style={{ background: "rgba(0,255,135,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{market?.label}</p>
            <p className="text-sm font-bold text-white">
              {market?.options.find((o) => o.key === selection)?.label}
            </p>
          </div>

          <div className="flex gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: emoji === e ? "rgba(0,255,135,0.15)" : "#151515",
                  border: emoji === e ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <textarea
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
            placeholder="Sababu yako (hiari)..."
            rows={3}
            maxLength={150}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && <p className="text-xs text-bashiri-red">{error}</p>}

          <BashiriButton className="w-full" loading={submitting} onClick={handleSubmit}>
            Shiriki →
          </BashiriButton>
        </div>
      )}
    </BottomSheet>
  );
}
