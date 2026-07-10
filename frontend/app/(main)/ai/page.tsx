"use client";
import { useState } from "react";
import { sendChatMessage } from "@/lib/api/chat";
import { BashiriButton } from "@/components/ui/Button";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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

  const SUGGESTIONS = [
    '🏆 Nani atashinda City vs Arsenal?',
    '⚽ Uwezo wa Man United',
    '🔥 Chelsea vs Liverpool',
    '📊 Takwimu za Tottenham',
    '🎯 Matokeo ya Everton',
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-[#050508]">
      {/* Header */}
      <div className="px-5 pt-safe pt-6 pb-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E8892A] flex items-center justify-center">
          <Sparkles size={20} className="text-black" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">Bashiri AI</h1>
          <p className="text-xs text-white/50">Mtaalamu wa mechi za soka</p>
        </div>
        {remaining !== null && (
          <div className="px-3 py-1.5 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/30">
            <span className="text-xs font-bold text-[#F5A623]">{remaining} yamebaki</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-40">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div
              className="text-6xl mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ⚽
            </motion.div>
            <h2 className="text-xl font-black text-white mb-2">Bashiri AI</h2>
            <p className="text-sm text-white/50 mb-8 max-w-xs">
              Niulize kuhusu mechi yoyote — "Nani atashinda City vs Arsenal?"
            </p>
            
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {SUGGESTIONS.map((suggestion) => (
                <motion.button
                  key={suggestion}
                  onClick={() => setInput(suggestion.replace(/[🏆⚽🔥📊🎯]\s/, ''))}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 rounded-2xl text-xs font-medium bg-[#1A1A24] border border-white/10 hover:border-[#F5A623]/30 hover:bg-[#22222E] transition-all text-white/80"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="rounded-3xl px-4 py-3 max-w-[85%] md:max-w-[70%] text-sm leading-relaxed"
              style={{
                background: m.role === "user" 
                  ? "linear-gradient(135deg, #F5A623, #E8892A)" 
                  : "rgba(26,26,36,0.9)",
                color: m.role === "user" ? "#000" : "#fff",
                border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                borderBottomRightRadius: m.role === "user" ? 8 : undefined,
                borderBottomLeftRadius: m.role !== "user" ? 8 : undefined,
              }}
            >
              {m.content}
            </div>
          </motion.div>
        ))}
        
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#E8892A] flex items-center justify-center text-xs font-black text-black flex-shrink-0">
              B
            </div>
            <div className="px-4 py-3 rounded-3xl rounded-bl-sm bg-[#1A1A24] border border-white/10">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#F5A623]"
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-4 pb-safe bg-[#050508] border-t border-white/10 flex gap-2 z-[100]">
        <div className="flex-1 flex items-end gap-2 rounded-3xl px-4 py-3 bg-[#1A1A24] border border-white/10 focus-within:border-[#F5A623]/30 transition-all">
          <input
            className="flex-1 bg-transparent text-sm text-white outline-none resize-none"
            placeholder="Andika swali lako..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
        </div>
        <motion.button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E8892A] flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#F5A623]/20"
        >
          {loading ? (
            <Loader2 size={20} className="text-black animate-spin" />
          ) : (
            <Send size={20} className="text-black" />
          )}
        </motion.button>
      </div>
    </div>
  );
}