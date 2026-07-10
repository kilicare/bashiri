"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoomHistory } from "@/lib/api/matchroom";
import { getMatchDashboard } from "@/lib/api/predictions";
import { useMatchRoomSocket } from "@/hooks/useMatchRoomSocket";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Send } from "lucide-react";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ReportButton } from "@/components/report/ReportButton";

function getCountdown(target?: string): string {
  if (!target) return "00:00:00";
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "00:00:00";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function MatchRoomPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.matchId);
  const [roomState, setRoomState] = useState<string>("");
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [kickoffAt, setKickoffAt] = useState<string>("");
  const [countdown, setCountdown] = useState<string>("00:00:00");
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { requireAuth, isAuthed } = useRequireAuth();

  useEffect(() => {
    getRoomHistory(matchId).then((data) => {
      setRoomState(data.room_state);
      setInitialMessages(data.messages);
      setKickoffAt(data.kickoff_at || "");
      setLoading(false);
    });
  }, [matchId]);

  useEffect(() => {
    if (!kickoffAt) return;
    
    setCountdown(getCountdown(kickoffAt));
    
    intervalRef.current = setInterval(() => {
      setCountdown(getCountdown(kickoffAt));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [kickoffAt]);

  const { messages, connected, error, sendMessage } = useMatchRoomSocket(matchId, initialMessages);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!requireAuth("Jiunge na mazungumzo — jisajili kwa sekunde chache!")) return;
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

  if (loading) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  if (roomState === "closed") {
    return (
      <DerbyThemeProvider matchId={matchId}>
        <div className="max-w-2xl mx-auto min-h-dvh flex flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-black text-white mb-2">Room Imefungwa</p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Mechi imekwisha. Angalia historia hapa chini (read-only).
          </p>
          <div className="w-full space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="text-xs text-left">
                <span className="font-bold text-white">@{m.username}: </span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{m.content}</span>
              </div>
            ))}
          </div>
        </div>
      </DerbyThemeProvider>
    );
  }

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div className="max-w-2xl mx-auto min-h-dvh flex flex-col">
        <div className="px-5 pt-safe pt-6 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white">
              {roomState === "watch_party" ? "🎉 Watch Party" : "💬 Match Room"}
            </h1>
            {roomState === "watch_party" && countdown !== "00:00:00" && (
              <p className="text-xs font-mono font-bold mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                ⏱️ Anza: {countdown}
              </p>
            )}
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{
            background: connected ? "rgba(0,255,135,0.1)" : "rgba(255,71,87,0.1)",
            color: connected ? "#00FF87" : "#FF4757",
          }}>
            {connected ? "● Live" : "○ Inaunganisha..."}
          </span>
        </div>

        <MatchHubTabs matchId={matchId} active="room" />

        {error && <p className="px-5 text-xs text-bashiri-red mb-2">{error}</p>}

        <div className="flex-1 px-4 space-y-2 overflow-y-auto pb-2">
          {messages.map((m: any) => (
            <div key={m.id} className="text-sm flex items-start justify-between gap-2">
              <div>
                <span className="font-bold" style={{ color: "#00FF87" }}>@{m.username}: </span>
                <span className="text-white">{m.content}</span>
              </div>
              <ReportButton contentType="ROOM_MESSAGE" objectId={m.id} />
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="px-4 py-3 pb-safe flex gap-2">
          <input
            className="flex-1 rounded-2xl px-4 py-3 text-sm text-white bg-[#151515] outline-none"
            placeholder={isAuthed ? "Andika ujumbe..." : "Ingia kutuma ujumbe..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            maxLength={200}
          />
          <button onClick={handleSend} className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#00FF87" }} aria-label="Tuma ujumbe">
            <Send size={18} style={{ color: "#000" }} />
          </button>
        </div>
      </div>
    </DerbyThemeProvider>
  );
}