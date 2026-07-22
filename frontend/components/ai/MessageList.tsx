"use client";

import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { TypingIndicator } from "./TypingIndicator";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  toolResult?: {
    tool_name: string;
    data: any;
  };
  id?: number;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onHelpful?: (messageId: number) => void;
  onNotHelpful?: (messageId: number) => void;
}

export function MessageList({ messages, isLoading = false, onHelpful, onNotHelpful }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return <UserMessage key={index} content={message.content} timestamp={message.timestamp} />;
        }
        return <AIMessage 
          key={index} 
          content={message.content} 
          timestamp={message.timestamp} 
          toolResult={message.toolResult}
          messageId={message.id}
          onHelpful={onHelpful}
          onNotHelpful={onNotHelpful}
        />;
      })}
      
      {isLoading && <TypingIndicator />}
    </div>
  );
}
