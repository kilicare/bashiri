"use client";
import { useRouter } from "next/navigation";
import { Crown, Target, TrendingUp, Zap, Settings, LogOut, Award, Calendar, Camera, Loader2, Edit2, Share2, MapPin, ChevronLeft, BarChart3, X, Flame, Sparkles, Power } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { PremiumButton } from "@/components/ui/Button";
import { PremiumCard, GlassCard } from "@/components/ui/GlassCard";
import { PremiumBadge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { updateAvatar, completeProfile } from "@/lib/api/auth";
import { getAIPerformanceStats } from "@/lib/api/predictions";
import { ShareProfileModal } from "@/components/profile/ShareProfileModal";
import { QRCodeModal } from "@/components/profile/QRCodeModal";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editDob, setEditDob] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiPerformance, setAiPerformance] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    fetchAIPerformance();
  }, []);

  async function fetchAIPerformance() {
    try {
      const data = await getAIPerformanceStats();
      setAiPerformance(data);
    } catch (error) {
      console.error("Failed to fetch AI performance:", error);
    } finally {
      setLoadingAI(false);
    }
  }

  if (!user) return null;

  // Initialize edit values when user is available
  if (editUsername === "" && user.username) {
    setEditUsername(user.username);
  }
  if (editDob === "" && user.date_of_birth) {
    setEditDob(user.date_of_birth);
  }

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

  async function handleProfileSave() {
    if (!editUsername || !editDob) {
      alert("Tafadhali jaza username na tarehe ya kuzaliwa.");
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await completeProfile(editUsername, editDob);
      setUser(updatedUser);
      setEditingProfile(false);
    } catch (error) {
      alert("Imeshindika kuhifadhi mabadiliko. Jaribu tena.");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleEditProfileClick() {
    if (!user) return;
    setEditUsername(user.username || "");
    setEditDob(user.date_of_birth || "");
    setEditingProfile(true);
  }

  const STATS = loadingAI ? [
    { label: "Usahihi", value: "Loading...", icon: <Target size={20} />, color: "from-[var(--success)]/20 to-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]", subtitle: "" },
    { label: "Sahihi", value: "Loading...", icon: <TrendingUp size={20} />, color: "from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/10 border-[var(--brand-primary)]/30 text-[var(--brand-primary)]", subtitle: "" },
    { label: "Jumla", value: "Loading...", icon: <Zap size={20} />, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400", subtitle: "" },
    { label: "Streak", value: "Loading...", icon: <Flame size={20} />, color: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400", subtitle: "" },
  ] : [
    { 
      label: "Usahihi (Wiki)", 
      value: `${aiPerformance?.weekly?.accuracy_percentage || 0}%`, 
      icon: <Sparkles size={20} />, 
      color: "from-[var(--success)]/20 to-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]",
      subtitle: "AI Performance"
    },
    { 
      label: "Sahihi", 
      value: aiPerformance?.weekly?.correct_predictions || 0, 
      icon: <TrendingUp size={20} />, 
      color: "from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/10 border-[var(--brand-primary)]/30 text-[var(--brand-primary)]",
      subtitle: "Weekly Correct"
    },
    { 
      label: "Jumla", 
      value: aiPerformance?.weekly?.total_predictions || 0, 
      icon: <Zap size={20} />, 
      color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
      subtitle: "Weekly Predictions"
    },
    { 
      label: "Usahihi (Leo)", 
      value: `${aiPerformance?.daily?.accuracy_percentage || 0}%`, 
      icon: <Flame size={20} />, 
      color: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400",
      subtitle: "Today's Accuracy"
    },
  ];

  return (
    <div className="min-h-dvh bg-[#050508] overflow-y-auto no-scrollbar">
      {/* Cover */}
      <div className="relative h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/20 via-[#050508] to-[#050508]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]" />
        <div className="absolute top-0 right-0 flex gap-2 p-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
          <motion.button
            onClick={handleEditProfileClick}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <Edit2 size={18} />
          </motion.button>
          <motion.button
            onClick={() => setShareModalOpen(true)}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <Share2 size={18} />
          </motion.button>
          <motion.button
            onClick={() => { logout(); router.push("/login"); }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-red-500/20 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
            title="Toka"
          >
            <Power size={18} />
          </motion.button>
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="px-5 -mt-16 relative z-10 pb-4">
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--brand-accent)]/30 to-[var(--brand-accent)]/20 flex items-center justify-center text-3xl font-black text-white border-4 border-[#050508] shadow-lg shadow-[var(--brand-accent)]/20 overflow-hidden">
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
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/30">
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <button
              onClick={handleCameraClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/30 hover:scale-110 transition-transform disabled:opacity-50 z-20"
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/10 border border-[var(--brand-primary)]/30 flex items-center justify-center">
                <Crown size={24} className="text-[var(--brand-primary)]" />
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
          <PremiumBadge variant="sand">Member</PremiumBadge>
        </div>

        {/* Phone */}
        <p className="text-white/60 text-sm leading-relaxed mb-3">
          {user.phone_number}
        </p>

        {/* Location + joined */}
        <div className="flex flex-wrap gap-4 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[var(--brand-primary)]" />
            <span className="text-white/60">Tanzania</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[var(--brand-primary)]" />
            <span className="text-white/60">Member</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-[var(--brand-primary)]" />
          <span className="text-sm font-bold text-white/80">AI Performance Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
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
              {stat.subtitle && (
                <p className="text-xs text-white/40 mt-1">{stat.subtitle}</p>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Weekly Trend Mini Chart */}
        {!loadingAI && aiPerformance?.weekly_trend && aiPerformance.weekly_trend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 rounded-2xl p-4 backdrop-blur-sm border border-white/10 bg-white/5"
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-[var(--brand-primary)]" />
              <span className="text-xs text-white/60">Weekly Trend</span>
            </div>
            <div className="flex items-end gap-2 h-16">
              {aiPerformance.weekly_trend.map((day: any, index: number) => {
                const height = Math.max(10, (day.accuracy_percentage / 100) * 60);
                const isToday = index === aiPerformance.weekly_trend.length - 1;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${isToday ? 'bg-[var(--brand-primary)]' : 'bg-white/20'}`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-xs text-white/40">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
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
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
            style={{ background: "#111111" }}
          >
            <Calendar size={18} style={{ color: "var(--brand-accent)" }} />
            <span className="text-sm font-bold text-white">Video Zangu</span>
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
        >
          <button 
            onClick={() => router.push("/track-record")}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
            style={{ background: "#111111" }}
          >
            <BarChart3 size={18} style={{ color: "var(--brand-accent)" }} />
            <span className="text-sm font-bold text-white">📊 Bashiri Track Record</span>
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <button 
            onClick={() => router.push("/settings")}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
            style={{ background: "#111111" }}
          >
            <Settings size={18} style={{ color: "var(--brand-accent)" }} />
            <span className="text-sm font-bold text-white">Settings</span>
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
              className="w-full rounded-2xl p-4 flex items-center gap-3 text-left bg-gradient-to-r from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/5"
            >
              <Crown size={18} style={{ color: "var(--brand-primary)" }} />
              <span className="text-sm font-bold text-[var(--brand-primary)]">Upgrade to PRO</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {editingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
            onClick={() => setEditingProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#111] rounded-3xl p-6 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Hariri Profaili</h2>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                    placeholder="Weka username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Tarehe ya Kuzaliwa
                  </label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                  />
                </div>

                <PremiumButton
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  size="lg"
                  fullWidth
                  className="mt-6"
                >
                  {savingProfile ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "Hifadhi Mabadiliko"
                  )}
                </PremiumButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Profile Modal */}
      <ShareProfileModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        username={user?.username || ""}
        onOpenQR={() => setQrModalOpen(true)}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={user?.username || ""}
      />
    </div>
  );
}