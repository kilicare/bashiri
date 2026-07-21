"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  onRemove: () => void;
  isLoading?: boolean;
}

export function ImagePreview({ src, onRemove, isLoading = false }: ImagePreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative rounded-2xl overflow-hidden border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Image */}
      <div className="relative w-full h-32 md:h-40">
        {isLoading ? (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--surface-alt)" }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--brand-primary)" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <img
            src={src}
            alt="Attachment preview"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Remove Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
        }}
        aria-label="Remove image"
      >
        <X size={14} style={{ color: "#fff" }} />
      </motion.button>

      {/* Label */}
      <div 
        className="px-3 py-2 text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        Image Preview
      </div>
    </motion.div>
  );
}
