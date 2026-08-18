"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api/chat";
import { AIHeader } from "./AIHeader";
import { MessageList, Message } from "./MessageList";
import { AIComposer } from "./AIComposer";
import { EmptyState } from "./EmptyState";
import { ContextChips } from "./ContextChips";
import { X } from "lucide-react";

export function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [lastMatchContext, setLastMatchContext] = useState<{id: number, label: string} | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Keyboard detection
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.innerHeight;
      const isSmallViewport = viewportHeight < 500;
      setIsKeyboardOpen(isSmallViewport);
      
      // Auto-scroll when keyboard opens/closes
      if (messages.length > 0) {
        scrollToBottom();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [messages.length]);

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
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
        toolResult: data.tool_result,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setRemaining(data.remaining_today);
      
      // Update context if tool_result contains match info
      if (data.tool_result && data.tool_result.tool_name === "predict_fixture" && (data.tool_result.data as any)?.data?.match_id) {
        setLastMatchContext({
          id: (data.tool_result.data as any).data.match_id,
          label: `${(data.tool_result.data as any).data.home_team} vs ${(data.tool_result.data as any).data.away_team}`,
        });
      } else if (data.tool_result && data.tool_result.tool_name === "search_matches" && (data.tool_result.data as any)?.data?.matches?.length > 0) {
        const firstMatch = (data.tool_result.data as any).data.matches[0];
        setLastMatchContext({
          id: firstMatch.id,
          label: `${firstMatch.home_team} vs ${firstMatch.away_team}`,
        });
      }
    } catch (e: unknown) {
      const errorMessage: Message = {
        role: "assistant",
        content: e instanceof Error ? e.message : "Something went wrong. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Auto-send the suggestion immediately
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const handleHelpful = async (messageId: number) => {
    try {
      // TODO: Call feedback API endpoint with "positive"
      console.log(`Positive feedback for message ${messageId}`);
    } catch (e) {
      console.error("Failed to submit feedback", e);
    }
  };

  const handleNotHelpful = async (messageId: number) => {
    try {
      // TODO: Call feedback API endpoint with "negative"
      console.log(`Negative feedback for message ${messageId}`);
    } catch (e) {
      console.error("Failed to submit feedback", e);
    }
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
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{
          paddingTop: '16px',
          paddingBottom: isKeyboardOpen ? '140px' : '100px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          <>
            <MessageList 
              messages={messages} 
              isLoading={loading} 
              onHelpful={handleHelpful}
              onNotHelpful={handleNotHelpful}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer Container */}
      <div className="fixed bottom-0 left-0 right-0 z-[100]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Context Chips */}
        {lastMatchContext && (
          <div className="px-4 pb-2">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: "var(--surface-alt)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>💬 Sasa: {lastMatchContext.label}</span>
              <button
                onClick={() => setLastMatchContext(null)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
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
