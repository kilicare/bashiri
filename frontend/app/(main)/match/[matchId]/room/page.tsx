"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoomHistory } from "@/lib/api/matchroom";
import { getMatchDashboard } from "@/lib/api/predictions";
import { useMatchRoomSocket } from "@/hooks/useMatchRoomSocket";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Clock3, Send, Smile, Sparkles } from "lucide-react";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";

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
  const [showNewMessages, setShowNewMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { requireAuth, isAuthed } = useRequireAuth();
  const currentUserName = useAuthStore((s) => s.user?.username);

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

  const { messages, connected, error, sendMessage } = useMatchRoomSocket(matchId, roomState === "watch_party" || roomState === "live" ? initialMessages : []);

  useEffect(() => {
    if (roomState === "watch_party" || roomState === "live" || roomState === "closed") {
      setShowNewMessages(false);
    }
  }, [roomState]);

  function getInitials(value?: string) {
    if (!value) return "U";
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  function formatTimestamp(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function scrollToBottom(force = true) {
    if (!messageListRef.current) return;
    if (force) {
      messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
      return;
    }
    const nearBottom = messageListRef.current.scrollHeight - messageListRef.current.scrollTop - messageListRef.current.clientHeight < 80;
    if (nearBottom) {
      messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
    }
  }

  useEffect(() => {
    const node = messageListRef.current;
    if (!node) return;

    const handleScroll = () => {
      const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
      shouldAutoScrollRef.current = nearBottom;
      if (nearBottom) setShowNewMessages(false);
    };

    node.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => node.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom(true);
      setShowNewMessages(false);
    } else {
      setShowNewMessages(true);
    }
  }, [messages]);

  function handleSend() {
    if (!requireAuth("Jiunge na mazungumzo — jisajili kwa sekunde chache!")) return;
    if (!input.trim()) return;
    shouldAutoScrollRef.current = true;
    setShowNewMessages(false);
    sendMessage(input);
    setInput("");
  }

  if (loading) return <div className="px-5 pt-safe pt-10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}><CardSkeleton /></div>;

  if (roomState === "upcoming") {
    return (
      <DerbyThemeProvider matchId={matchId}>
        <div className="max-w-2xl mx-auto min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
          <p className="text-lg font-black text-white mb-2">⏰ Inakuja Hivi Karibuni</p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Watch Party itafunguliwa masaa 10 kabla ya kickoff kwa majaribio ya sasa. Rudi hapa kwa wakati.
          </p>
          {kickoffAt && (
            <p className="text-sm font-mono" style={{ color: "#AFCE18" }}>
              Anza: {countdown}
            </p>
          )}
        </div>
      </DerbyThemeProvider>
    );
  }

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
      <div className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(175,206,24,0.12),transparent_45%)]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--background)]/95 backdrop-blur-xl">
          <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#AFCE18]/15 text-[#AFCE18]">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h1 className="text-base font-black text-white">
                      {roomState === "watch_party" ? "WATCH PARTY 🙋‍♂️" : "💬 Match Room"}
                    </h1>
                    {roomState === "watch_party" && countdown !== "00:00:00" && (
                      <p className="mt-0.5 text-[11px] font-mono font-semibold text-white/60">
                        ⏱️ Starts in {countdown}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#AFCE18]/20 bg-[#AFCE18]/10 px-2.5 py-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-[#AFCE18]" : "bg-[#FF4757]"}`} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: connected ? "#AFCE18" : "#FF4757" }}>
                  {connected ? "Live" : "Connecting"}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Clock3 size={14} className="text-[#AFCE18]" />
              <p className="text-[11px] font-medium text-white/40">
               Realtime talk • Live feels • Continuous scroll
              </p>
            </div>
          </div>

          <div className="px-4 pb-3 sm:px-5">
            <MatchHubTabs matchId={matchId} active="room" />
          </div>
        </header>

        {error && <p className="px-4 pt-2 text-xs font-medium text-cyan-400 sm:px-5">{error}</p>}

        <div ref={messageListRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:px-5">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {messages.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
                Be the first to join the conversation.
              </div>
            ) : (
              messages.map((m: any) => {
                const isOwnMessage = Boolean(currentUserName && m.username && m.username === currentUserName);
                const avatarUrl = m.user?.profile?.image || m.user?.avatar || m.profile_image || m.avatar || m.user?.profile_photo || m.user?.image;
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    {!isOwnMessage && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#AFCE18]/20 to-[#F5A623]/20 text-[11px] font-black uppercase text-[#AFCE18]">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={m.username} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(m.username)
                        )}
                      </div>
                    )}
                    <div className={`flex max-w-[85%] items-end gap-2 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`rounded-[22px] border px-3.5 py-2.5 shadow-sm ${isOwnMessage ? "border-[#AFCE18]/30 bg-[#AFCE18] text-black" : "border-white/10 bg-[#151515] text-white"}`}>
                        <div className={`mb-1 flex items-center gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                          <span className={`text-[11px] font-bold ${isOwnMessage ? "text-black/70" : "text-[#AFCE18]"}`}>@{m.username}</span>
                          <span className={`text-[10px] ${isOwnMessage ? "text-black/60" : "text-white/45"}`}>{formatTimestamp(m.created_at)}</span>
                        </div>
                        <p className="text-sm leading-6 whitespace-pre-wrap break-words">{m.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {showNewMessages && (
          <button
            onClick={() => {
              shouldAutoScrollRef.current = true;
              setShowNewMessages(false);
              scrollToBottom(true);
            }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full border border-[#AFCE18]/30 bg-[var(--background)]/95 px-3.5 py-2 text-[11px] font-semibold text-[#AFCE18] shadow-lg"
          >
            New messages ↓
          </button>
        )}

        <div className="shrink-0 border-t border-white/10 bg-[var(--background)]/95 px-4 py-3 pb-safe sm:px-5">
          <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-[24px] border border-white/10 bg-[#131313] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70" aria-label="Emoji">
              <Smile size={18} />
            </button>
            <input
              className="h-11 flex-1 rounded-xl border-0 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/35"
              placeholder={isAuthed ? "Andika ujumbe..." : "Ingia kutuma ujumbe..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              maxLength={200}
            />
            <button onClick={handleSend} className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#AFCE18" }} aria-label="Tuma ujumbe">
              <Send size={18} style={{ color: "#000" }} />
            </button>
          </div>
        </div>
      </div>
    </DerbyThemeProvider>
  );
}