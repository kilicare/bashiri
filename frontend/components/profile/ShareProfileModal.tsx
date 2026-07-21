"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Copy, X, Share2, Check, QrCode } from "lucide-react";
import { useState } from "react";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onOpenQR: () => void;
}

export function ShareProfileModal({ isOpen, onClose, username, onOpenQR }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const profileUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/profile/${username}`
    : `https://bashiri.co.tz/profile/${username}`;

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500",
      action: () => {
        const text = `Angalia profaili yangu ya Bashiri! 🎯⚽\n\n${profileUrl}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      },
    },
    {
      name: "QR Code",
      icon: QrCode,
      color: "bg-purple-500",
      action: () => {
        onClose();
        onOpenQR();
      },
    },
    {
      name: "Copy Link",
      icon: Copy,
      color: "bg-gray-600",
      action: () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
  ];

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Bashiri Profile",
          text: `Angalia profaili yangu ya Bashiri! 🎯⚽`,
          url: profileUrl,
        });
      } catch (error) {
        console.log("Share canceled");
      }
    }
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
            className="w-full max-w-sm bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center">
                  <Share2 size={18} className="text-black" />
                </div>
                <h2 className="text-xl font-bold text-white">Shiriki Profaili</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Link Preview */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-black">@{username?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">@{username}</p>
                  <p className="text-xs text-white/50 truncate">{profileUrl}</p>
                </div>
              </div>
            </div>

            {/* Share Options Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                const isCopyButton = option.name === "Copy Link";
                const showCopied = isCopyButton && copied;
                
                return (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105 border border-white/10"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${showCopied ? "bg-green-500" : option.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      {showCopied ? (
                        <Check size={28} className="text-white" />
                      ) : (
                        <Icon size={28} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-white">
                      {showCopied ? "Imekopiwa!" : option.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Native Share Button */}
            {typeof window !== "undefined" && "share" in navigator && (
              <button
                onClick={handleShare}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black hover:opacity-90 transition-all hover:scale-105 shadow-lg"
              >
                <Share2 size={20} />
                <span>Shiriki kwa Njia Nyingine</span>
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
