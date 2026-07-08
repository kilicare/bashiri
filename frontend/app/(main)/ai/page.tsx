"use client";
import { useState } from "react";
import { sendChatMessage } from "@/lib/api/chat";
import { BashiriButton } from "@/components/ui/Button";
import { Sparkles } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

export default function AIChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await sendChatMessage(input);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setRemaining(data.remaining_today);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: e.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="px-5 pt-safe pt-6 pb-3 flex items-center gap-2">
        <Sparkles size={20} style={{ color: "#00FF87" }} />
        <h1 className="text-xl font-black text-white">Bashiri AI</h1>
        {remaining !== null && (
          <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Maswali {remaining} yamebaki</span>
        )}
      </div>

      <div className="flex-1 px-4 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-10" style={{ color: "rgba(255,255,255,0.4)" }}>
            Niulize kuhusu mechi yoyote — "Nani atashinda City vs Arsenal?"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="rounded-2xl px-4 py-3 max-w-[80%] text-sm"
              style={{
                background: m.role === "user" ? "#00FF87" : "#111111",
                color: m.role === "user" ? "#000" : "#fff",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Bashiri AI inafikiria...</p>}
      </div>

      <div className="px-4 py-3 pb-safe flex gap-2">
        <input
          className="flex-1 rounded-2xl px-4 py-3 text-sm text-white bg-[#151515] outline-none"
          placeholder="Andika swali lako..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <BashiriButton onClick={handleSend} loading={loading}>Tuma</BashiriButton>
      </div>
    </div>
  );
}