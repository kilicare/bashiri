"use client";
import { useRouter } from "next/navigation";
import { Crown, Target, TrendingUp, Zap, Settings, LogOut, Award, Calendar, Camera, Loader2, Edit2, Share2, MapPin, ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { PremiumButton } from "@/components/ui/Button";
import { PremiumCard, GlassCard } from "@/components/ui/GlassCard";
import { PremiumBadge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { updateAvatar } from "@/lib/api/auth";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Picha isiyozidi 5MB inaruhusiwa.");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Aina ya picha inaruhusiwa: JPEG, PNG, au WebP.");
      return;
    }

    setUploading(true);
    try {
      const updatedUser = await updateAvatar(file);
      setUser(updatedUser);
    } catch (error) {
      alert("Imeshindwa ku-upload picha. Jaribu tena.");
    } finally {
      setUploading(false);
    }
  }

  function handleCameraClick() {
    fileInputRef.current?.click();
  }

  const STATS = [
    { label: "Usahihi", value: `${user.accuracy_percentage}%`, icon: <Target size={20} />, color: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400" },
    { label: "Sahihi", value: user.correct_predictions, icon: <TrendingUp size={20} />, color: "from-[#F5A623]/20 to-[#E8892A]/10 border-[#F5A623]/30 text-[#F5A623]" },
    { label: "Jumla", value: user.total_predictions, icon: <Zap size={20} />, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400" },
    { label: "Streak", value: user.current_streak, icon: <Award size={20} />, color: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400" },
  ];

  return (
    <div className="min-h-dvh bg-[#050508] overflow-y-auto no-scrollbar">
      {/* Cover */}
      <div className="relative h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/20 via-[#050508] to-[#050508]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]" />
        <div className="absolute top-0 right-0 flex gap-2 p-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
          <motion.button
            onClick={() => router.push("/settings")}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <Edit2 size={18} />
          </motion.button>
          <motion.button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied!");
            }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <Share2 size={18} />
          </motion.button>
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="px-5 -mt-16 relative z-10 pb-4">
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/30 to-purple-600/20 flex items-center justify-center text-3xl font-black text-white border-4 border-[#050508] shadow-lg shadow-purple-500/20 overflow-hidden">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                user.username?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E8892A] flex items-center justify-center shadow-lg shadow-[#F5A623]/30">
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <button
              onClick={handleCameraClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E8892A] flex items-center justify-center shadow-lg shadow-[#F5A623]/30 hover:scale-110 transition-transform disabled:opacity-50 z-20"
            >
              {uploading ? (
                <Loader2 size={18} className="text-black animate-spin" />
              ) : (
                <Camera size={18} className="text-black" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            {user.is_subscription_active && (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5A623]/20 to-[#E8892A]/10 border border-[#F5A623]/30 flex items-center justify-center">
                <Crown size={24} className="text-[#F5A623]" />
              </div>
            )}
          </div>
        </div>

        {/* Name + badges */}
        <h1 className="text-2xl font-black text-white mb-1">
          @{user.username}
        </h1>
        <div className="flex flex-wrap gap-2 mb-3">
          {user.is_subscription_active && (
            <PremiumBadge variant="gold">PRO</PremiumBadge>
          )}
          <PremiumBadge variant="purple">Member</PremiumBadge>
        </div>

        {/* Phone */}
        <p className="text-white/60 text-sm leading-relaxed mb-3">
          {user.phone_number}
        </p>

        {/* Location + joined */}
        <div className="flex flex-wrap gap-4 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[#F5A623]" />
            <span className="text-white/60">Tanzania</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#F5A623]" />
            <span className="text-white/60">Member</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        {STATS.map((stat) => (
          <motion.div
            key={stat.label}
            className={`rounded-2xl p-4 backdrop-blur-sm border cursor-pointer group transition-all duration-300 hover:scale-105 ${stat.color}`}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-center gap-2 mb-2">
              {stat.icon}
              <span className="text-xs text-white/60">{stat.label}</span>
            </div>
            <p className="text-2xl font-black text-white">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-5 space-y-3 pb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button 
            onClick={() => router.push("/history")}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-4 bg-[#1A1A24] border border-white/10 hover:bg-[#22222E] hover:border-white/20 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Calendar size={20} className="text-white/60" />
            </div>
            <span className="text-sm font-semibold text-white flex-1">Prediction History</span>
            <svg className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <button 
            onClick={() => router.push("/settings")}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-4 bg-[#1A1A24] border border-white/10 hover:bg-[#22222E] hover:border-white/20 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Settings size={20} className="text-white/60" />
            </div>
            <span className="text-sm font-semibold text-white flex-1">Settings</span>
            <svg className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>

        {!user.is_subscription_active && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button 
              onClick={() => router.push("/subscribe")}
              className="w-full rounded-2xl p-4 text-left flex items-center gap-4 bg-gradient-to-r from-[#F5A623]/10 to-[#E8892A]/5 border border-[#F5A623]/20 hover:border-[#F5A623]/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 flex items-center justify-center group-hover:bg-[#F5A623]/20 transition-colors">
                <Crown size={20} className="text-[#F5A623]" />
              </div>
              <span className="text-sm font-semibold text-[#F5A623] flex-1">Upgrade to PRO</span>
              <svg className="w-5 h-5 text-[#F5A623]/50 group-hover:text-[#F5A623] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Logout Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PremiumButton 
            variant="outline" 
            size="lg" 
            fullWidth 
            onClick={() => { logout(); router.push("/login"); }}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 !rounded-2xl"
          >
            <LogOut size={20} />
            Toka
          </PremiumButton>
        </motion.div>
      </div>
    </div>
  );
}