"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminTicketDetail, replyAdminTicket, updateTicketStatus } from "@/lib/api/admin";
import { ArrowLeft, Send } from "lucide-react";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const STATUS_COLORS: Record<string, string> = {
  OPEN: "#FFD600", IN_PROGRESS: "#3B82F6", RESOLVED: "#00FF87", CLOSED: "rgba(255,255,255,0.4)",
};

export default function AdminSupportTicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params.id);
  const [ticket, setTicket] = useState<any>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, [ticketId]);

  function load() {
    getAdminTicketDetail(ticketId).then(setTicket);
  }

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ticket?.messages?.length]);

  async function handleSend() {
    if (!input.trim()) return;
    setSending(true);
    await replyAdminTicket(ticketId, input);
    setInput("");
    await load();
    setSending(false);
  }

  async function handleStatusChange(statusValue: string) {
    await updateTicketStatus(ticketId, statusValue);
    load();
  }

  if (!ticket) return <p style={{ color: "rgba(255,255,255,0.5)" }}>Inapakia...</p>;

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="mb-4"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>

      <div className="rounded-2xl p-5 mb-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-black text-white">{ticket.subject}</h1>
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="px-2 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: ticket.status === s ? `${STATUS_COLORS[s]}33` : "rgba(255,255,255,0.05)",
                  color: ticket.status === s ? STATUS_COLORS[s] : "rgba(255,255,255,0.4)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {ticket.user_username ? `@${ticket.user_username}` : (ticket.guest_phone || "Guest")} • {ticket.type}
        </p>
        {ticket.related_content_type && (
          <p className="text-xs mt-1" style={{ color: "#FF4757" }}>
            🚩 Related: {ticket.related_content_type} #{ticket.related_object_id}
          </p>
        )}
      </div>

      <div className="rounded-2xl p-5 mb-4 space-y-3" style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.06)", maxHeight: 400, overflowY: "auto" }}>
        {ticket.messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.sender_type === "ADMIN" ? "justify-end" : "justify-start"}`}>
            <div
              className="rounded-2xl px-4 py-3 max-w-[80%] text-sm"
              style={{ background: m.sender_type === "ADMIN" ? "#00FF87" : "#151515", color: m.sender_type === "ADMIN" ? "#000" : "#fff" }}
            >
              {m.sender_type === "USER" && (
                <p className="text-[10px] font-bold mb-1" style={{ color: "#00FF87" }}>
                  {ticket.user_username ? `@${ticket.user_username}` : "Guest"}
                </p>
              )}
              {m.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-2xl px-4 py-3 text-sm text-white bg-[#151515] outline-none"
          placeholder="Jibu ticket hii..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} disabled={sending} className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#00FF87" }}>
          <Send size={18} style={{ color: "#000" }} />
        </button>
      </div>
    </div>
  );
}
