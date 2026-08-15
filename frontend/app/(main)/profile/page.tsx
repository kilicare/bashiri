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
import { AlertModal } from "@/components/ui/AlertModal";

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
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; variant: "success" | "error" | "warning" | "info" }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info"
  });

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
      setAlertModal({
        isOpen: true,
        title: "Picha Kubwa Sana",
        message: "Picha isiyozidi 5MB inaruhusiwa.",
        variant: "warning"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAlertModal({
        isOpen: true,
        title: "Aina ya Picha",
        message: "Aina ya picha inaruhusiwa: JPEG, PNG, au WebP.",
        variant: "warning"
      });
      return;
    }

    setUploading(true);
    try {
      const updatedUser = await updateAvatar(file);
      setUser(updatedUser);
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: "Imeshindwa",
        message: "Imeshindwa ku-upload picha. Jaribu tena.",
        variant: "error"
      });
    } finally {
      setUploading(false);
    }
  }

  function handleCameraClick() {
    fileInputRef.current?.click();
  }

  async function handleProfileSave() {
    if (!editUsername || !editDob) {
      setAlertModal({
        isOpen: true,
        title: "Taarifa Zinazokosea",
        message: "Tafadhali jaza username na tarehe ya kuzaliwa.",
        variant: "warning"
      });
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await completeProfile(editUsername, editDob);
      setUser(updatedUser);
      setEditingProfile(false);
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: "Imeshindika",
        message: "Imeshindika kuhifadhi mabadiliko. Jaribu tena.",
        variant: "error"
      });
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
      <div className="relative h-48 overflow-hidden">
        {/* Animated Multi-Color Mist Effect */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#050508] via-[#050508] to-[#050508]" />
          
          {/* Mist Layer 1 - Gold flowing gradient */}
          <motion.div 
            className="absolute inset-0 opacity-35"
            animate={{
              backgroundPosition: ["0% 0%", "200% 200%", "0% 0%"],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: "radial-gradient(ellipse at 30% 40%, rgba(212, 175, 55, 0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(207, 175, 123, 0.15) 0%, transparent 50%)",
              backgroundSize: "300% 300%",
            }}
          />
          
          {/* Mist Layer 2 - Green counter flowing */}
          <motion.div 
            className="absolute inset-0 opacity-30"
            animate={{
              backgroundPosition: ["100% 100%", "0% 0%", "100% 100%"],
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: "radial-gradient(ellipse at 50% 30%, rgba(76, 175, 80, 0.18) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(102, 187, 106, 0.12) 0%, transparent 45%)",
              backgroundSize: "250% 250%",
            }}
          />
          
          {/* Mist Layer 3 - Sea blue/silver diagonal flow */}
          <motion.div 
            className="absolute inset-0 opacity-25"
            animate={{
              backgroundPosition: ["0% 100%", "100% 0%", "0% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background: "radial-gradient(ellipse at 80% 20%, rgba(192, 192, 192, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, rgba(135, 206, 250, 0.1) 0%, transparent 40%)",
              backgroundSize: "200% 200%",
            }}
          />
          
          {/* Floating particles with three colors */}
          <div className="absolute inset-0">
            {[...Array(24)].map((_, i) => {
              const startX = Math.random() * 100;
              const startY = Math.random() * 100;
              const endX = Math.random() * 100;
              const endY = Math.random() * 100;
              
              // Cycle through three colors: gold, green, sea blue/silver
              const colorIndex = i % 3;
              const colors = [
                { r: 212, g: 175, b: 55 },   // Gold
                { r: 76, g: 175, b: 80 },    // Green
                { r: 135, g: 206, b: 250 }  // Sea blue
              ];
              const color = colors[colorIndex];
              
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  animate={{
                    x: [`${startX}%`, `${endX}%`, `${startX}%`],
                    y: [`${startY}%`, `${endY}%`, `${startY}%`],
                    opacity: [0, 0.7, 0.3, 0.7, 0],
                    scale: [0, 1.2, 0.8, 1, 0],
                  }}
                  transition={{
                    duration: 10 + Math.random() * 8,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: `${3 + Math.random() * 5}px`,
                    height: `${3 + Math.random() * 5}px`,
                    background: `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 + Math.random() * 0.3})`,
                    filter: "blur(2px)",
                  }}
                />
              );
            })}
          </div>
        </div>
        
        {/* Gradient overlay for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]" />
        
        <div className="absolute top-0 right-0 flex gap-2 p-4 z-10" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
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
            onClick={() => router.push("/settings")}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <Settings size={18} />
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--brand-primary)]" />
            <span className="text-sm font-bold text-white/90">AI Performance Stats</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--brand-primary)]">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.4, ease: "easeOut" }}
              className={`rounded-2xl p-4 backdrop-blur-sm border cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden ${stat.color}`}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Icon with glow */}
              <div className="relative flex items-center gap-2 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 blur-xl opacity-50" style={{ background: stat.color.split(' ')[0] }} />
                  {stat.icon}
                </div>
                <span className="text-xs font-semibold text-white/70">{stat.label}</span>
              </div>
              
              {/* Value with animation */}
              <motion.p 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
                className="text-3xl font-black text-white relative z-10"
              >
                {stat.value}
              </motion.p>
              
              {/* Subtitle with badge */}
              {stat.subtitle && (
                <div className="mt-2 relative z-10">
                  <span className="text-xs font-medium text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    {stat.subtitle}
                  </span>
                </div>
              )}
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </motion.div>
          ))}
        </div>
        
        {/* Weekly Trend Mini Chart */}
        {!loadingAI && aiPerformance?.weekly_trend && aiPerformance.weekly_trend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 rounded-2xl p-5 backdrop-blur-sm border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[var(--brand-primary)]" />
                <span className="text-sm font-bold text-white/90">Weekly Trend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                  <span className="text-xs font-medium text-[var(--brand-primary)]">Accuracy</span>
                </div>
              </div>
            </div>
            <div className="relative h-32">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 25, 50, 75, 100].map((value) => (
                  <div key={value} className="flex items-center gap-2">
                    <span className="text-xs text-white/30 w-8 text-right">{value}%</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                ))}
              </div>
              {/* Bars */}
              <div className="absolute inset-0 flex items-end gap-2 pt-6 pl-10">
                {aiPerformance.weekly_trend.map((day: any, index: number) => {
                  const height = Math.max(8, (day.accuracy_percentage / 100) * 100);
                  const isToday = index === aiPerformance.weekly_trend.length - 1;
                  return (
                    <motion.div
                      key={day.date}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${height}%`, opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5, ease: "easeOut" }}
                      className="flex-1 flex flex-col items-center gap-2 group relative"
                    >
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-300 relative overflow-hidden ${isToday ? 'bg-gradient-to-t from-[var(--brand-primary)] to-[var(--brand-accent)]' : 'bg-gradient-to-t from-white/10 to-white/20'}`}
                        style={{ height: `${height}%` }}
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="px-2 py-1 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10">
                          <span className="text-xs font-bold text-white">{day.accuracy_percentage}%</span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium transition-colors ${isToday ? 'text-[var(--brand-primary)]' : 'text-white/40'}`}>
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              onClick={() => router.push("/history")}
              className="w-full rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
              style={{ background: "#111111" }}
            >
              <Calendar size={20} style={{ color: "var(--brand-accent)" }} />
              <span className="text-xs font-bold text-white">Video Zangu</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <button
              onClick={() => router.push("/track-record")}
              className="w-full rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
              style={{ background: "#111111" }}
            >
              <BarChart3 size={20} style={{ color: "var(--brand-accent)" }} />
              <span className="text-xs font-bold text-white">Track Record</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
          >
            <button
              onClick={() => router.push("/profile/payment-history")}
              className="w-full rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
              style={{ background: "#111111" }}
            >
              <Crown size={20} style={{ color: "#FFD600" }} />
              <span className="text-xs font-bold text-white">Malipo</span>
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <button 
              onClick={() => router.push("/settings")}
              className="w-full rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
              style={{ background: "#111111" }}
            >
              <Settings size={20} style={{ color: "var(--brand-accent)" }} />
              <span className="text-xs font-bold text-white">Settings</span>
            </button>
          </motion.div>
        </div>

        {!user.is_subscription_active && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3"
          >
            <button 
              onClick={() => router.push("/subscribe")}
              className="w-full rounded-2xl p-4 flex items-center justify-center gap-3 text-center bg-gradient-to-r from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/5"
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

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  );
}