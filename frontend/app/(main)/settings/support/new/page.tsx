"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/lib/api/support";
import { BashiriButton } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

const TYPES = [
  { key: "ACCOUNT_ISSUE", label: "Tatizo la Akaunti" },
  { key: "PAYMENT_ISSUE", label: "Tatizo la Malipo" },
  { key: "BUG_REPORT", label: "Hitilafu ya App" },
  { key: "FEEDBACK", label: "Maoni" },
  { key: "OTHER", label: "Nyingine" },
];

export default function NewSupportTicketPage() {
  const router = useRouter();
  const [type, setType] = useState("ACCOUNT_ISSUE");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      setError("Jaza kichwa cha habari na ujumbe.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const ticket = await createTicket({ type, subject, message });
      router.push(`/settings/support/${ticket.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-6 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} aria-label="Rudi nyuma"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <h1 className="text-xl font-black text-white">Ticket Mpya</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>Aina ya Tatizo</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-left"
                style={{
                  background: type === t.key ? "rgba(0,255,135,0.12)" : "#151515",
                  border: type === t.key ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.08)",
                  color: type === t.key ? "#00FF87" : "#fff",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <input
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
          placeholder="Kichwa cha habari (mfano: Subscription haijaamka)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
          placeholder="Eleza tatizo lako kwa undani..."
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {error && <p className="text-xs text-bashiri-red">{error}</p>}

        <BashiriButton className="w-full" size="lg" loading={loading} onClick={handleSubmit}>Tuma Ticket →</BashiriButton>
      </div>
    </div>
  );
}
