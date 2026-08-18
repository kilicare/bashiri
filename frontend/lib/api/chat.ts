import { apiClient } from "./client";

export function sendChatMessage(message: string, sessionKey?: string) {
  return apiClient<{ 
    reply: string; 
    remaining_today: number;
    tool_result?: {
      tool_name: string;
      data: Record<string, unknown>;
    };
  }>("/chat/", {
    method: "POST",
    skipAuth: !sessionKey && false,
    body: JSON.stringify({ message, session_key: sessionKey }),
  });
}