"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api/chat";
import { AIHeader } from "./AIHeader";
import { MessageList, Message } from "./MessageList";
import { AIComposer } from "./AIComposer";
import { EmptyState } from "./EmptyState";

export function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function handleSend() {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      const data = await sendChatMessage(input);
      const aiMessage: Message = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setRemaining(data.remaining_today);
    } catch (e: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: e.message || "Something went wrong. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Focus on input after selecting suggestion
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      textarea?.focus();
    }, 100);
  };

  return (
    <div 
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <AIHeader remaining={remaining} />

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 px-4 py-4 overflow-y-auto pb-32 scroll-smooth"
      >
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          <>
            <MessageList messages={messages} isLoading={loading} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <div className="fixed bottom-20 left-0 right-0 z-[100]">
        <AIComposer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isLoading={loading}
          disabled={loading}
        />
      </div>
    </div>
  );
}
