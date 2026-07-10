"use client";
import { useState } from "react";
import { Flag } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BashiriButton } from "@/components/ui/Button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { submitContentReport } from "@/lib/api/report";

const REASONS = [
  { key: "ABUSIVE", label: "Matusi" },
  { key: "INAPPROPRIATE", label: "Maudhui Yasiyofaa" },
  { key: "SPAM", label: "Spam" },
  { key: "OTHER", label: "Nyingine" },
];

interface Props {
  contentType: "MIC_REACTION" | "USER_PREDICTION_CARD" | "ROOM_MESSAGE";
  objectId: number;
}

export function ReportButton({ contentType, objectId }: Props) {
  const { requireAuth } = useRequireAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function openSheet() {
    if (!requireAuth("Tusaidie kuweka jamii salama — jisajili kwa sekunde!")) return;
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setSubmitted(false);
    setReason("");
    setNote("");
    setError("");
  }

  async function handleSubmit() {
    if (!reason) return;
    setError("");
    try {
      await submitContentReport({ content_type: contentType, object_id: objectId, reason, note });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || "Imeshindwa kutuma ripoti.");
    }
  }

  return (
    <>
      <button 
        onClick={openSheet} 
        className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all"
        style={{ color: "rgba(255,255,255,0.8)" }}
        aria-label="Ripoti"
      >
        <Flag size={14} />
      </button>

      <BottomSheet isOpen={isOpen} onClose={handleClose} title="Ripoti Maudhui">
        {submitted ? (
          <p className="text-sm text-center py-4" style={{ color: "#F5A623" }}>
            Asante — ripoti yako imetumwa kwa timu yetu.
          </p>
        ) : (
          <div className="space-y-3">
            {REASONS.map((r) => (
              <button
                key={r.key}
                onClick={() => setReason(r.key)}
                className="w-full text-left rounded-xl px-4 py-3 text-sm"
                style={{
                  background: reason === r.key ? "rgba(255,71,87,0.12)" : "#151515",
                  border: reason === r.key ? "1px solid #FF4757" : "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                }}
              >
                {r.label}
              </button>
            ))}
            <textarea
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
              placeholder="Maelezo ya ziada (hiari)"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
            {error && <p className="text-xs text-bashiri-red">{error}</p>}
            <BashiriButton className="w-full" disabled={!reason} onClick={handleSubmit}>
              Tuma Ripoti
            </BashiriButton>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
