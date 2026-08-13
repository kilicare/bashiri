"use client";
import { useState } from "react";
import { Trash2, Play, Heart, Eye, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { MicReaction } from "@/lib/api/mic";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface MicVideoCardProps {
  reaction: MicReaction;
  onDelete: (id: number) => void;
}

export function MicVideoCard({ reaction, onDelete }: MicVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(reaction.id);
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-KE', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: Record<string, string> = {
      "FUNNY": "😂",
      "FIRE": "🔥",
      "ANGRY": "😡",
      "RESPECT": "👏",
      "SHOCK": "🤯",
      "PAIN": "💔",
    };
    return moodMap[mood] || "😊";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden border border-white/10"
    >
      {/* Video Preview */}
      <div className="relative aspect-video bg-black">
        {reaction.video_url ? (
          <video
            src={reaction.video_url}
            className="w-full h-full object-cover"
            onMouseEnter={() => setIsPlaying(true)}
            onMouseLeave={() => setIsPlaying(false)}
            controls={isPlaying}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Play size={48} className="text-white/30" />
          </div>
        )}
        
        {/* Mood Badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm">
          <span className="text-lg">{getMoodEmoji(reaction.mood)}</span>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm">
          <span className="text-xs font-bold text-white">
            {reaction.duration_seconds}s
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Match Info */}
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-white/50" />
          <span className="text-sm text-white/70">
            Match #{reaction.match}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-sm text-white/50">
            {formatDate(reaction.created_at)}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <Heart size={16} className="text-red-500" />
            <span className="text-sm font-bold text-white">{reaction.vote_count}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye size={16} className="text-blue-400" />
            <span className="text-sm text-white/70">Views</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={18} />
            <span>Futa</span>
          </button>
          <button
            onClick={() => window.open(`/match/${reaction.match}/mic`, '_blank')}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black hover:opacity-90 transition-opacity"
          >
            <Play size={18} />
            <span>Tazama</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Futa Video?"
        message="Una uhakika unataka kufuta video hii? Hatuwezi kurudisha baada ya kufuta."
        confirmText="Ndiyo, Futa"
        cancelText="Hapana"
        variant="danger"
      />
    </motion.div>
  );
}
