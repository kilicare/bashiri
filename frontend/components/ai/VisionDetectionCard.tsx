"use client";

import { motion } from "framer-motion";
import { Eye, CheckCircle } from "lucide-react";

interface Detection {
  label: string;
  confidence: number;
  value?: string;
}

interface VisionDetectionCardProps {
  detections: Detection[];
  imagePreview?: string;
}

export function VisionDetectionCard({ detections, imagePreview }: VisionDetectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-4 border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(212, 175, 55, 0.1)" }}
        >
          <Eye size={16} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h3 
          className="font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          Screenshot Analysis
        </h3>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          <img src={imagePreview} alt="Analyzed image" className="w-full h-32 object-cover" />
        </div>
      )}

      {/* Detections */}
      <div className="space-y-3">
        {detections.map((detection, index) => (
          <motion.div
            key={detection.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: "var(--surface-alt)" }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} style={{ color: "var(--success)" }} />
              <div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {detection.label}
                </div>
                {detection.value && (
                  <div 
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {detection.value}
                  </div>
                )}
              </div>
            </div>
            <div 
              className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ 
                background: "rgba(212, 175, 55, 0.1)",
                color: "var(--brand-primary)"
              }}
            >
              {detection.confidence}%
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
