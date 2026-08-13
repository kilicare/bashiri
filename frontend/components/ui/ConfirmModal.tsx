"use client";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ndiyo",
  cancelText = "Hapana",
  variant = "danger"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: "rgba(255, 100, 100, 0.2)",
      border: "rgba(255, 100, 100, 0.3)",
      icon: "#FF6464",
      button: "#FF6464"
    },
    warning: {
      bg: "rgba(255, 200, 50, 0.2)",
      border: "rgba(255, 200, 50, 0.3)",
      icon: "#FFC832",
      button: "#FFC832"
    },
    info: {
      bg: "rgba(212, 175, 55, 0.2)",
      border: "rgba(212, 175, 55, 0.3)",
      icon: "#D4AF37",
      button: "#D4AF37"
    }
  };

  const color = colors[variant];

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl p-6 max-w-sm w-full mx-4"
        style={{ background: "#111111", border: `1px solid ${color.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: color.bg }}
          >
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            {message}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold transition-all"
              style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl font-bold transition-all"
              style={{ background: color.button, color: "#000" }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
