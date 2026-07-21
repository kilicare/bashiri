"use client";

import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { TypingIndicator } from "./TypingIndicator";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return <UserMessage key={index} content={message.content} timestamp={message.timestamp} />;
        }
        return <AIMessage key={index} content={message.content} timestamp={message.timestamp} />;
      })}
      
      {isLoading && <TypingIndicator />}
    </div>
  );
}
