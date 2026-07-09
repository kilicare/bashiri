"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTicketDetail, replyToTicket, SupportTicketDetail } from "@/lib/api/support";
import { ArrowLeft, Send } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#FFD600", IN_PROGRESS: "#3B82F6", RESOLVED: "#00FF87", CLOSED: "rgba(255,255,255,0.4)",
};

export default function SupportTicketThreadPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params.id);
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, [ticketId]);

  function load() {
    getTicketDetail(ticketId).then(setTicket);
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  async function handleSend() {
    if (!input.trim()) return;
    setSending(true);
    await replyToTicket(ticketId, input);
    setInput("");
    await load();
    setSending(false);
  }

  if (!ticket) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="px-5 pt-safe pt-6 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Rudi nyuma"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <div className="flex-1">
          <h1 className="text-base font-black text-white">{ticket.subject}</h1>
          <span className="text-[10px] font-bold" style={{ color: STATUS_COLORS[ticket.status] }}>{ticket.status}</span>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-3 overflow-y-auto pb-2">
        {ticket.messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_type === "ADMIN" ? "justify-start" : "justify-end"}`}>
            <div
              className="rounded-2xl px-4 py-3 max-w-[80%] text-sm"
              style={{
                background: m.sender_type === "ADMIN" ? "#111111" : "#00FF87",
                color: m.sender_type === "ADMIN" ? "#fff" : "#000",
                border: m.sender_type === "ADMIN" ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              {m.sender_type === "ADMIN" && (
                <p className="text-[10px] font-bold mb-1" style={{ color: "#00FF87" }}>Bashiri Support</p>
              )}
              {m.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {ticket.status !== "CLOSED" && (
        <div className="px-4 py-3 pb-safe flex gap-2">
          <input
            className="flex-1 rounded-2xl px-4 py-3 text-sm text-white bg-[#151515] outline-none"
            placeholder="Andika ujumbe..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} disabled={sending} className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#00FF87" }} aria-label="Tuma ujumbe">
            <Send size={18} style={{ color: "#000" }} />
          </button>
        </div>
      )}
    </div>
  );
}
