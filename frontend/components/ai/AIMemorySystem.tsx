"use client";

import { motion } from "framer-motion";
import { Brain, Check, X, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface AIMemoryItem {
  id: string;
  type: "preference" | "behavior" | "context";
  content: string;
  confidence: number;
  lastUsed: string;
}

interface AIMemorySystemProps {
  memories: AIMemoryItem[];
  onKeepMemory?: (id: string) => void;
  onRemoveMemory?: (id: string) => void;
  onEditMemory?: (id: string, newContent: string) => void;
}

export function AIMemorySystem({ 
  memories, 
  onKeepMemory, 
  onRemoveMemory, 
  onEditMemory 
}: AIMemorySystemProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEdit = (memory: AIMemoryItem) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      onEditMemory?.(editingId, editContent);
      setEditingId(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case "preference":
        return <Check size={14} style={{ color: "var(--success)" }} />;
      case "behavior":
        return <Brain size={14} style={{ color: "var(--brand-primary)" }} />;
      case "context":
        return <Edit size={14} style={{ color: "var(--brand-accent)" }} />;
      default:
        return <Brain size={14} />;
    }
  };

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case "preference":
        return "var(--success)";
      case "behavior":
        return "var(--brand-primary)";
      case "context":
        return "var(--brand-accent)";
      default:
        return "var(--text-secondary)";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(212, 175, 55, 0.1)" }}
        >
          <Brain size={20} style={{ color: "var(--brand-primary)" }} />
        </div>
        <div>
          <h3 
            className="font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            BASHIRI Remembers
          </h3>
          <p 
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Personalized AI memory
          </p>
        </div>
      </div>

      {/* Memory List */}
      <div className="space-y-3">
        {memories.map((memory, index) => (
          <motion.div
            key={memory.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: `${getMemoryTypeColor(memory.type)}20`,
                  color: getMemoryTypeColor(memory.type)
                }}
              >
                {getMemoryIcon(memory.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {editingId === memory.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 rounded-lg text-sm outline-none border resize-none"
                      style={{
                        background: "var(--surface-alt)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                        minHeight: "60px",
                      }}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: "var(--gradient-gold)",
                          color: "#000",
                        }}
                      >
                        Save
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: "var(--glass-bg)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {memory.content}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div 
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Confidence: {memory.confidence}%
                      </div>
                      <div 
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Last used: {memory.lastUsed}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              {editingId !== memory.id && (
                <div className="flex gap-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(memory)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--glass-bg)" }}
                  >
                    <Edit size={14} style={{ color: "var(--text-secondary)" }} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onRemoveMemory?.(memory.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(239, 68, 68, 0.1)" }}
                  >
                    <Trash2 size={14} style={{ color: "var(--danger)" }} />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {memories.length === 0 && (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "var(--surface-alt)" }}
        >
          <Brain size={32} style={{ color: "var(--text-muted)" }} />
          <div 
            className="text-sm mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            No memories yet
          </div>
          <div 
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            BASHIRI will learn your preferences over time
          </div>
        </div>
      )}
    </div>
  );
}
