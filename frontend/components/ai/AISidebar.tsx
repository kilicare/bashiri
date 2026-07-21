"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Settings, X, Menu } from "lucide-react";
import { useState } from "react";
import { ConversationList } from "./ConversationList";
import { Conversation } from "./ConversationTypes";

interface AISidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onArchiveConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onSearch?: (query: string) => void;
  onOpenSettings?: () => void;
}

export function AISidebar({
  conversations,
  activeConversationId,
  isOpen,
  isMobile,
  onClose,
  onSelectConversation,
  onCreateConversation,
  onArchiveConversation,
  onDeleteConversation,
  onSearch,
  onOpenSettings,
}: AISidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
            />
            
            {/* Mobile Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50"
              style={{ background: "var(--background)" }}
            >
              <div className="flex flex-col h-full p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 
                    className="text-lg font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Conversations
                  </h2>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--glass-bg)" }}
                  >
                    <X size={18} style={{ color: "var(--text-secondary)" }} />
                  </motion.button>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search 
                      size={16} 
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                  <ConversationList
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={onSelectConversation}
                    onCreateConversation={onCreateConversation}
                    onArchiveConversation={onArchiveConversation}
                    onDeleteConversation={onDeleteConversation}
                  />
                </div>

                {/* Settings */}
                <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenSettings}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--text-secondary)",
                      border: "1px solid",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-alt)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop Sidebar
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isOpen ? 320 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full border-r overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="w-80 h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Conversations
          </h2>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--glass-bg)" }}
          >
            <Menu size={18} style={{ color: "var(--text-secondary)" }} />
          </motion.button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search 
              size={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none border"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={onSelectConversation}
            onCreateConversation={onCreateConversation}
            onArchiveConversation={onArchiveConversation}
            onDeleteConversation={onDeleteConversation}
          />
        </div>

        {/* Settings */}
        <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onOpenSettings}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              border: "1px solid",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-alt)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Settings size={16} />
            <span>Settings</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
