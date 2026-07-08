"use client";
import { useRouter } from "next/navigation";
import { Crown, Target, TrendingUp, Zap, Settings, LogOut, Award, Calendar, Camera, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { PremiumButton } from "@/components/ui/Button";
import { PremiumCard, GlassCard } from "@/components/ui/GlassCard";
import { PremiumBadge } from "@/components/ui/Badge";
import { motion } from "framer-motion";
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
    { label: "Sahihi", value: user.correct_predictions, icon: <TrendingUp size={20} />, color: "from-[#FFD54A]/20 to-[#FFB300]/10 border-[#FFD54A]/30 text-[#FFD54A]" },
    { label: "Jumla", value: user.total_predictions, icon: <Zap size={20} />, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400" },
    { label: "Streak", value: user.current_streak, icon: <Award size={20} />, color: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400" },
  ];

  return (
    <div className="min-h-dvh bg-[#050508] pb-24">
      {/* Premium Header */}
      <div className="px-5 pt-safe pt-6 pb-4 animate-fadeIn">
        <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
          Profile
        </h1>
      </div>

      <div className="px-5 space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/30 to-purple-600/20 flex items-center justify-center text-3xl font-black text-white border-2 border-purple-500/30 shadow-lg shadow-purple-500/20 overflow-hidden">
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
                {user.is_subscription_active && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#FFD54A] to-[#FFB300] rounded-full flex items-center justify-center shadow-lg z-10">
                    <Crown size={16} className="text-black" />
                  </div>
                )}
                <button
                  onClick={handleCameraClick}
                  disabled={uploading}
                  className="absolute -top-1 -right-1 w-7 h-7 bg-[#00FF87] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 z-20"
                >
                  {uploading ? (
                    <Loader2 size={12} className="text-black animate-spin" />
                  ) : (
                    <Camera size={12} className="text-black" />
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
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-2xl font-black text-white">@{user.username}</p>
                  {user.is_subscription_active && (
                    <PremiumBadge variant="gold">PRO</PremiumBadge>
                  )}
                </div>
                <p className="text-sm text-white/50 mb-3">{user.phone_number}</p>
                {!user.is_subscription_active && (
                  <button 
                    onClick={() => router.push("/subscribe")} 
                    className="text-sm font-semibold text-[#FFD54A] hover:text-[#FFE082] transition-colors flex items-center gap-1"
                  >
                    Panda PRO
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {STATS.map((stat, index) => (
            <PremiumCard key={stat.label} hover className={`p-4 bg-gradient-to-br ${stat.color} border`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-xl bg-white/5 ${stat.color.split(' ')[2]}`}>
                  {stat.icon}
                </div>
                <span className="text-xs font-semibold text-white/60">{stat.label}</span>
              </div>
              <p className={`text-3xl font-black ${stat.color.split(' ')[2]}`}>{stat.value}</p>
            </PremiumCard>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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

        {/* Logout Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PremiumButton 
            variant="outline" 
            size="lg" 
            fullWidth 
            onClick={() => { logout(); router.push("/login"); }}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={20} />
            Toka
          </PremiumButton>
        </motion.div>
      </div>
    </div>
  );
}