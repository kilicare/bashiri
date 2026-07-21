"use client";

import { motion } from "framer-motion";
import { MessageSquare, Archive, MoreHorizontal, Clock } from "lucide-react";
import { useState } from "react";
import { Conversation, ConversationCategory } from "./ConversationTypes";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onArchiveConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
}

const CATEGORY_ICONS: Record<ConversationCategory, React.ReactNode> = {
  "match-analysis": "⚽",
  "betting": "🎯",
  "statistics": "📊",
  "news": "🔥",
  "general": "💬",
};

const CATEGORY_COLORS: Record<ConversationCategory, string> = {
  "match-analysis": "var(--brand-primary)",
  "betting": "var(--brand-accent)",
  "statistics": "var(--info)",
  "news": "var(--warning)",
  "general": "var(--text-secondary)",
};

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onArchiveConversation,
  onDeleteConversation,
  onRenameConversation,
}: ConversationListProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const groupedConversations = conversations.reduce((acc, conv) => {
    const dateKey = formatDate(conv.updatedAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onCreateConversation}
        className="w-full mb-4 px-4 py-3 rounded-xl font-medium text-sm border transition-all"
        style={{
          background: "var(--gradient-gold)",
          color: "#000",
          borderColor: "transparent",
        }}
      >
        + New Chat
      </motion.button>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {Object.entries(groupedConversations).map(([date, convs]) => (
          <div key={date}>
            <div 
              className="text-xs font-bold mb-2 px-2"
              style={{ color: "var(--text-muted)" }}
            >
              {date}
            </div>
            <div className="space-y-1">
              {convs.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative group"
                >
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                      activeConversationId === conv.id ? "border-2" : "border"
                    }`}
                    style={{
                      background: activeConversationId === conv.id 
                        ? "rgba(212, 175, 55, 0.1)" 
                        : "var(--surface)",
                      borderColor: activeConversationId === conv.id 
                        ? "var(--brand-primary)" 
                        : "var(--border)",
                      color: "var(--text-primary)",
                    }}
                    onMouseEnter={(e) => {
                      if (activeConversationId !== conv.id) {
                        e.currentTarget.style.background = "var(--surface-alt)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeConversationId !== conv.id) {
                        e.currentTarget.style.background = "var(--surface)";
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ 
                          background: "var(--glass-bg)",
                          color: CATEGORY_COLORS[conv.category]
                        }}
                      >
                        {CATEGORY_ICONS[conv.category]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate mb-1">
                          {conv.title}
                        </div>
                        {conv.lastMessage && (
                          <div 
                            className="text-xs truncate"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {conv.lastMessage}
                          </div>
                        )}
                      </div>

                      {/* Message Count */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <MessageSquare size={12} style={{ color: "var(--text-muted)" }} />
                        <span 
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {conv.messageCount}
                        </span>
                      </div>
                    </div>
                  </motion.button>

                  {/* Menu Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMenu(showMenu === conv.id ? null : conv.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "var(--glass-bg)" }}
                  >
                    <MoreHorizontal size={14} style={{ color: "var(--text-secondary)" }} />
                  </motion.button>

                  {/* Dropdown Menu */}
                  {showMenu === conv.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-full mt-1 p-2 rounded-xl border shadow-lg z-10"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onArchiveConversation?.(conv.id);
                            setShowMenu(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                          style={{
                            background: "var(--glass-bg)",
                            color: "var(--text-secondary)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--glass-bg-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--glass-bg)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                          }}
                        >
                          <Archive size={14} />
                          <span>Archive</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onDeleteConversation?.(conv.id);
                            setShowMenu(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                          style={{
                            background: "var(--glass-bg)",
                            color: "var(--danger)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--glass-bg)";
                          }}
                        >
                          <Clock size={14} />
                          <span>Delete</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
