"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { Conversation } from "./ConversationTypes";

interface ConversationSearchProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onClose: () => void;
}

interface SearchResult {
  conversation: Conversation;
  matchedMessages: string[];
  matchScore: number;
}

export function ConversationSearch({ 
  conversations, 
  onSelectConversation, 
  onClose 
}: ConversationSearchProps) {
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = conversations.map((conv) => {
      const lowerQuery = query.toLowerCase();
      const titleMatch = conv.title.toLowerCase().includes(lowerQuery);
      const lastMessageMatch = conv.lastMessage?.toLowerCase().includes(lowerQuery) || false;
      
      let matchScore = 0;
      const matchedMessages: string[] = [];

      if (titleMatch) {
        matchScore += 10;
        matchedMessages.push(conv.title);
      }

      if (lastMessageMatch) {
        matchScore += 5;
        matchedMessages.push(conv.lastMessage || "");
      }

      return {
        conversation: conv,
        matchedMessages,
        matchScore,
      };
    }).filter((result) => result.matchScore > 0);

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [conversations, query]);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={index}
          style={{
            background: "rgba(212, 175, 55, 0.3)",
            color: "var(--brand-primary)",
            padding: "0 2px",
            borderRadius: "2px",
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <Search size={20} style={{ color: "var(--text-secondary)" }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-lg outline-none"
            style={{ color: "var(--text-primary)" }}
            autoFocus
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--glass-bg)" }}
          >
            <X size={18} style={{ color: "var(--text-secondary)" }} />
          </motion.button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4">
          {query.trim() === "" ? (
            <div 
              className="text-center py-8"
              style={{ color: "var(--text-secondary)" }}
            >
              <Search size={32} style={{ color: "var(--text-muted)" }} />
              <div className="text-sm mt-2">Type to search conversations</div>
            </div>
          ) : searchResults.length === 0 ? (
            <div 
              className="text-center py-8"
              style={{ color: "var(--text-secondary)" }}
            >
              No results found for "{query}"
            </div>
          ) : (
            <>
              <div 
                className="text-xs mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {searchResults.length} {searchResults.length === 1 ? "result" : "results"} found
              </div>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <motion.button
                    key={result.conversation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectConversation(result.conversation.id);
                      onClose();
                    }}
                    className="w-full p-4 rounded-xl text-left border transition-all"
                    style={{
                      background: "var(--surface-alt)",
                      borderColor: "var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface)";
                      e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface-alt)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-medium text-sm mb-1"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {highlightMatch(result.conversation.title, query)}
                        </div>
                        {result.conversation.lastMessage && (
                          <div 
                            className="text-xs truncate"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {highlightMatch(result.conversation.lastMessage, query)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Clock size={12} style={{ color: "var(--text-muted)" }} />
                        <span 
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {result.conversation.messageCount}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-4 py-3 border-t text-xs text-center"
          style={{ 
            borderColor: "var(--border)",
            color: "var(--text-muted)"
          }}
        >
          Press ESC to close
        </div>
      </motion.div>
    </motion.div>
  );
}
