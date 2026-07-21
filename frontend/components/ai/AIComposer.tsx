"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Attachment, AttachmentType } from "./AttachmentTypes";
import { ImagePreview } from "./ImagePreview";

interface AIComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isRecording?: boolean;
  hasVoicePermission?: boolean;
  attachments?: Attachment[];
  onAttachmentAdd?: (attachment: Attachment) => void;
  onAttachmentRemove?: (id: string) => void;
  onCameraCapture?: () => void;
}

export function AIComposer({ 
  value, 
  onChange, 
  onSend, 
  isLoading = false, 
  disabled = false,
  onVoiceStart,
  onVoiceStop,
  isRecording = false,
  hasVoicePermission = false,
  attachments = [],
  onAttachmentAdd,
  onAttachmentRemove,
  onCameraCapture
}: AIComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      onVoiceStop?.();
    } else {
      onVoiceStart?.();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const attachment: Attachment = {
          id: Date.now().toString(),
          type: 'image',
          file,
          preview: reader.result as string,
          name: file.name,
          size: file.size,
        };
        onAttachmentAdd?.(attachment);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    onCameraCapture?.();
  };

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isLoading && !disabled;

  return (
    <div 
      className="px-4 py-4 pb-safe"
      style={{
        background: "var(--background)",
        borderTop: `1px solid var(--border)`,
      }}
    >
      {/* Attachment Previews */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-2 mb-3 overflow-x-auto pb-2"
          >
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex-shrink-0 w-32">
                {attachment.type === 'image' && attachment.preview && (
                  <ImagePreview
                    src={attachment.preview}
                    onRemove={() => onAttachmentRemove?.(attachment.id)}
                  />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex items-end gap-3 rounded-3xl px-4 py-3 transition-all duration-300"
        style={{
          background: isFocused ? "var(--surface)" : "var(--surface)",
          border: `1px solid ${isFocused ? "rgba(212, 175, 55, 0.3)" : "var(--border)"}`,
          backdropFilter: "var(--glass-blur)",
        }}
      >
        {/* Attachment Button */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: showAttachmentMenu ? "var(--surface-alt)" : "var(--glass-bg)",
              color: showAttachmentMenu ? "var(--text-primary)" : "var(--text-secondary)",
            }}
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </motion.button>

          {/* Attachment Menu */}
          <AnimatePresence>
            {showAttachmentMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 p-2 rounded-2xl border shadow-lg"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div className="flex flex-col gap-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAttachmentClick}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
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
                    <Paperclip size={16} />
                    <span>Upload Image</span>
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCameraClick}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
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
                    <Camera size={16} />
                    <span>Camera</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask Bashiri AI..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-2"
          style={{
            color: "var(--text-primary)",
            minHeight: "24px",
            maxHeight: "150px",
          }}
        />

        {/* Voice Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleVoiceClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: isRecording 
              ? "rgba(239, 68, 68, 0.2)" 
              : "var(--glass-bg)",
            color: isRecording 
              ? "var(--danger)" 
              : "var(--text-secondary)",
            border: isRecording 
              ? "1px solid rgba(239, 68, 68, 0.3)" 
              : "none",
          }}
          onMouseEnter={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = "var(--glass-bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = "var(--glass-bg)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }
          }}
          aria-label={isRecording ? "Stop recording" : "Voice input"}
        >
          <motion.div
            animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          >
            <Mic size={18} />
          </motion.div>
        </motion.button>

        {/* Send Button */}
        <motion.button
          onClick={onSend}
          disabled={!canSend}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: canSend ? "var(--gradient-gold)" : "var(--surface)",
            color: canSend ? "#000" : "var(--text-muted)",
            opacity: canSend ? 1 : 0.4,
            cursor: canSend ? "pointer" : "not-allowed",
            boxShadow: canSend ? "var(--shadow-gold)" : "none",
          }}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </motion.button>
      </div>
    </div>
  );
}
