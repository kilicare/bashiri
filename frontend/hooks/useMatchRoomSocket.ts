"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";

interface WSMessage {
  type: "message" | "presence" | "error";
  message?: Message;
  action?: "join" | "leave";
  username?: string;
  detail?: string;
}

interface Message {
  id: number;
  username: string;
  content: string;
  created_at: string;
}

const WS_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api")
  .replace("http://", "ws://")
  .replace("https://", "wss://")
  .replace("/api", "");

export function useMatchRoomSocket(matchId: number, initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const isUnmountingRef = useRef(false);
  const previousMatchIdRef = useRef(matchId);
  const connectRef = useRef<(() => void) | null>(null);
  const access = useAuthStore((s) => s.access);

  const mergeMessages = useCallback((existing: Message[], incoming: Message[]) => {
    const byId = new Map<string, Message>();
    for (const message of [...existing, ...incoming]) {
      if (!message?.id) continue;
      byId.set(String(message.id), message);
    }
    return Array.from(byId.values()).sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
  }, []);

  const connect = useCallback(() => {
    if (!access || isUnmountingRef.current) return;

    // Close any existing connection before opening a new one (Strict Mode safety)
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Connection might already be closed, ignore
      }
      wsRef.current = null;
    }

    const ws = new WebSocket(`${WS_BASE_URL}/ws/match/${matchId}/room/?token=${access}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(""); // Clear error state on successful connection
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      const data: WSMessage = JSON.parse(event.data);
      if (data.type === "message" && data.message) {
        setMessages((prev) => {
          const exists = prev.some((message) => String(message?.id) === String(data.message?.id));
          if (exists) return prev;
          return mergeMessages(prev, [data.message as Message]);
        });
      } else if (data.type === "error") {
        setError(data.detail || "Hitilafu imetokea.");
      }
    };

    ws.onclose = (event) => {
      setConnected(false);

      // Don't reconnect if this was a normal closure (code 1000) or if we're unmounting
      if (event.code === 1000 || isUnmountingRef.current) {
        return;
      }

      // Reconnect logic — muhimu kwa mtandao wa simu unaokatika mara kwa mara
      if (reconnectAttempts.current < 5) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
        reconnectAttempts.current += 1;
        setTimeout(() => {
          if (!isUnmountingRef.current && connectRef.current) {
            connectRef.current();
          }
        }, delay);
      }
    };

    ws.onerror = () => {
      setError("Imeshindwa kuunganisha na Match Room.");
    };
  }, [matchId, access, mergeMessages]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Handle initial messages
  useEffect(() => {
    if (previousMatchIdRef.current !== matchId) {
      previousMatchIdRef.current = matchId;
      setMessages([]);
      return;
    }

    if (!initialMessages.length) return;

    const incoming = initialMessages.filter(
      (message) => !messages.some((m) => String(m?.id) === String(message?.id))
    );

    if (incoming.length > 0) {
      const merged = mergeMessages(messages, incoming);
      setMessages(merged);
    }
  }, [matchId, initialMessages, messages, mergeMessages]);

  useEffect(() => {
    isUnmountingRef.current = false;
    connect();
    
    return () => {
      isUnmountingRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  function sendMessage(content: string) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
    }
  }

  return { messages, connected, error, sendMessage };
}