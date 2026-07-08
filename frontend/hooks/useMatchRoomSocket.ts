"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";

interface WSMessage {
  type: "message" | "presence" | "error";
  message?: { id: number; username: string; content: string; created_at: string };
  action?: "join" | "leave";
  username?: string;
  detail?: string;
}

const WS_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api")
  .replace("http://", "ws://")
  .replace("https://", "wss://")
  .replace("/api", "");

export function useMatchRoomSocket(matchId: number, initialMessages: any[] = []) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const access = useAuthStore((s) => s.access);

  const connect = useCallback(() => {
    if (!access) return;

    const ws = new WebSocket(`${WS_BASE_URL}/ws/match/${matchId}/room/?token=${access}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      const data: WSMessage = JSON.parse(event.data);
      if (data.type === "message" && data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "error") {
        setError(data.detail || "Hitilafu imetokea.");
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect logic — muhimu kwa mtandao wa simu unaokatika mara kwa mara
      if (reconnectAttempts.current < 5) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
        reconnectAttempts.current += 1;
        setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      setError("Imeshindwa kuunganisha na Match Room.");
    };
  }, [matchId, access]);

  useEffect(() => {
    connect();
    return () => {
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