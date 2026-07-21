"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function QRCodeModal({ isOpen, onClose, username }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const profileUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/profile/${username}`
    : `https://bashiri.co.tz/profile/${username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">QR Code</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl mb-6 border border-gray-200">
              <QRCodeSVG
                value={profileUrl}
                size={200}
                level="H"
                includeMargin={false}
                className="w-full"
              />
            </div>

            {/* Info */}
            <p className="text-sm text-gray-600 text-center mb-6">
              Scan QR code kuona profaili ya @{username}
            </p>

            {/* Copy Link Button */}
            <button
              onClick={handleCopy}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black hover:opacity-90 transition-all hover:scale-105 shadow-lg"
            >
              {copied ? (
                <span className="text-sm">Imekopiwa!</span>
              ) : (
                <>
                  <Copy size={20} />
                  <span className="text-sm">Copy Link</span>
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
