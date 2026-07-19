"use client";
import { useState } from "react";
import { Flag, MoreVertical, X } from "lucide-react";
import { BashiriButton } from "@/components/ui/Button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { submitContentReport } from "@/lib/api/report";
import { motion, AnimatePresence } from "framer-motion";

const REASONS = [
  { key: "ABUSIVE", label: "Matusi" },
  { key: "INAPPROPRIATE", label: "Maudhui Yasiyofaa" },
  { key: "SPAM", label: "Spam" },
  { key: "OTHER", label: "Nyingine" },
];

interface ReportActionProps {
  contentType: "MIC_REACTION" | "ROOM_MESSAGE";
  objectId: number;
}

interface ReportButtonProps extends ReportActionProps {
  trigger?: "flag" | "dots";
}

interface ReportModalProps extends ReportActionProps {
  isOpen: boolean;
  onClose: () => void;
}

function ReportModal({ contentType, objectId, isOpen, onClose }: ReportModalProps) {
  const { requireAuth } = useRequireAuth();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setReason("");
    setNote("");
    setSubmitted(false);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!reason) return;
    if (!requireAuth("Tusaidie kuweka jamii salama — jisajili kwa sekunde!")) return;
    setError("");
    try {
      await submitContentReport({ content_type: contentType, object_id: objectId, reason, note });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || "Imeshindwa kutuma ripoti.");
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-[#111] rounded-3xl p-6 border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Ripoti Maudhui</h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {submitted ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--brand-primary)" }}>
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
                    background: reason === r.key ? "rgba(239,68,68,0.12)" : "#151515",
                    border: reason === r.key ? "1px solid var(--danger)" : "1px solid rgba(255,255,255,0.08)",
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
              <BashiriButton
                fullWidth
                disabled={!reason}
                onClick={handleSubmit}
              >
                Tuma Ripoti
              </BashiriButton>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ReportButton({ contentType, objectId, trigger = "flag" }: ReportButtonProps) {
  const { requireAuth } = useRequireAuth();
  const [isOpen, setIsOpen] = useState(false);

  function openSheet() {
    if (!requireAuth("Tusaidie kuweka jamii salama — jisajili kwa sekunde!")) return;
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={openSheet}
        className={`flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all ${
          trigger === "flag" ? "w-8 h-8" : "w-10 h-10"
        }`}
        style={{ color: "rgba(255,255,255,0.8)" }}
        aria-label="Ripoti"
      >
        {trigger === "flag" ? <Flag size={14} /> : <MoreVertical size={18} />}
      </button>

      <ReportModal
        contentType={contentType}
        objectId={objectId}
        isOpen={isOpen}
        onClose={handleClose}
      />
    </>
  );
}

export { ReportModal };
