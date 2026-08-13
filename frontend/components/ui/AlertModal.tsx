"use client";
import { createPortal } from "react-dom";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: "success" | "error" | "warning" | "info";
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Sawa",
  variant = "info"
}: AlertModalProps) {
  if (!isOpen) return null;

  const colors = {
    success: {
      bg: "rgba(0, 255, 135, 0.2)",
      border: "rgba(0, 255, 135, 0.3)",
      icon: "#00FF87",
      button: "#00FF87"
    },
    error: {
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

  const icons = {
    success: (
      <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    error: (
      <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    )
  };

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
            {icons[variant]}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            {message}
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold transition-all"
            style={{ background: color.button, color: "#000" }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
