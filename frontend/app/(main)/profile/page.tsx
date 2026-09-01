"use client";
import { useRouter } from "next/navigation";
import { Crown, Target, TrendingUp, Zap, Settings, LogOut, Award, Calendar, Camera, Loader2, Edit2, Share2, MapPin, ChevronLeft, BarChart3, X, Flame, Sparkles, Power, Eye, Trash2, Trophy } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { PremiumButton } from "@/components/ui/Button";
import { PremiumCard, GlassCard } from "@/components/ui/GlassCard";
import { PremiumBadge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { updateAvatar, completeProfile, deleteAccount } from "@/lib/api/auth";
import { getAIPerformanceStats } from "@/lib/api/predictions";
import { ShareProfileModal } from "@/components/profile/ShareProfileModal";
import { QRCodeModal } from "@/components/profile/QRCodeModal";
import { AlertModal } from "@/components/ui/AlertModal";
import { useMobileTooltip } from "@/hooks/useMobileTooltip";
import { AccuracySphere } from "@/components/profile/AccuracySphere";
import { MarketMasteryHeatmap } from "@/components/profile/MarketMasteryHeatmap";

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
  const [viewAvatarModal, setViewAvatarModal] = useState<{ isOpen: boolean; imageUrl: string }>({ isOpen: false, imageUrl: "" });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { tooltip, handleChartClick, hideTooltip } = useMobileTooltip();

  // Check for reduced motion preference
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function handleAvatarView(imageUrl: string) {
    setViewAvatarModal({ isOpen: true, imageUrl });
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

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      logout();
      router.push("/login");
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: "Imeshindika",
        message: "Imeshindika kufuta akaunti. Jaribu tena.",
        variant: "error"
      });
    } finally {
      setIsDeletingAccount(false);
      setDeleteConfirmModal(false);
    }
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

          {!reduceMotion && (
            <>
              {/* Optimized single gradient layer */}
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
                  willChange: "transform",
                }}
              />

              {/* Optimized floating particles - reduced from 24 to 8 */}
              <div className="absolute inset-0">
                {[...Array(8)].map((_, i) => {
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
                        willChange: "transform",
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
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
          <motion.button
            onClick={() => setDeleteConfirmModal(true)}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-red-500/20 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
            title="Futa Akaunti"
          >
            <Trash2 size={18} />
          </motion.button>
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="px-5 -mt-16 relative z-10 pb-4">
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Image Container */}
              <div 
                className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--brand-accent)]/30 to-[var(--brand-accent)]/20 flex items-center justify-center text-3xl font-black text-white border-4 border-[#050508] shadow-lg shadow-[var(--brand-accent)]/20 overflow-hidden cursor-pointer relative"
                onClick={() => user.avatar_url && handleAvatarView(user.avatar_url)}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  user.username?.[0]?.toUpperCase() || "?"
                )}
                
                {/* Overlay on hover to indicate clickable */}
                {user.avatar_url && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Eye size={24} className="text-white" />
                  </div>
                )}
              </div>
              
              {/* Online Status Indicator */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/30 border-2 border-[#050508]">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              </div>
              
              {/* Camera Upload Button */}
              <motion.button
                onClick={handleCameraClick}
                disabled={uploading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center shadow-xl shadow-[var(--brand-primary)]/40 hover:shadow-[var(--brand-primary)]/60 transition-all disabled:opacity-50 disabled:hover:scale-100 z-20 border-2 border-[#050508]"
                title="Badilisha picha ya profaili"
              >
                {uploading ? (
                  <Loader2 size={20} className="text-black animate-spin" />
                ) : (
                  <Camera size={20} className="text-black" />
                )}
              </motion.button>
            </motion.div>
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
          
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
            className="rounded-2xl p-4 backdrop-blur-sm border cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400"
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 mb-3">
              <Flame size={20} />
              <span className="text-xs font-semibold text-white/70">Best Streak</span>
            </div>
            <motion.p 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="text-3xl font-black text-white relative z-10"
            >
              {aiPerformance?.weekly?.best_streak || 0}
            </motion.p>
            <div className="mt-2 relative z-10">
              <span className="text-xs font-medium text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                Correct in a row
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.div>
        </div>
        
        {/* Unique Visualizations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 space-y-4"
        >
          {/* 3D Accuracy Sphere */}
          <div className="rounded-2xl p-5 backdrop-blur-sm border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--brand-primary)]" />
                <span className="text-sm font-bold text-white/90">Accuracy Sphere</span>
              </div>
              <span className="text-xs text-white/40">3D Visualization</span>
            </div>
            <div className="flex justify-center">
              <AccuracySphere 
                accuracy={aiPerformance?.weekly?.accuracy_percentage || 0} 
                size={180}
              />
            </div>
          </div>

          {/* Market Mastery Heatmap */}
          <div className="rounded-2xl p-5 backdrop-blur-sm border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[var(--brand-primary)]" />
                <span className="text-sm font-bold text-white/90">Market Mastery</span>
              </div>
              <span className="text-xs text-white/40">Heatmap</span>
            </div>
            <MarketMasteryHeatmap
              data={[
                { market: '1X2', accuracy: aiPerformance?.weekly?.market_accuracy?.["1x2"] || 0, predictions: aiPerformance?.weekly?.total_predictions || 0 },
                { market: 'BTTS', accuracy: aiPerformance?.weekly?.market_accuracy?.["btts"] || 0, predictions: Math.floor((aiPerformance?.weekly?.total_predictions || 0) * 0.6) },
                { market: 'O/U 2.5', accuracy: aiPerformance?.weekly?.market_accuracy?.["over_under"] || 0, predictions: Math.floor((aiPerformance?.weekly?.total_predictions || 0) * 0.8) },
                { market: 'Dbl Chance', accuracy: (aiPerformance?.weekly?.market_accuracy?.["1x2"] || 0) * 0.95, predictions: Math.floor((aiPerformance?.weekly?.total_predictions || 0) * 0.4) },
                { market: 'O/U 1.5', accuracy: (aiPerformance?.weekly?.market_accuracy?.["over_under"] || 0) * 0.8, predictions: Math.floor((aiPerformance?.weekly?.total_predictions || 0) * 0.5) },
                { market: 'Home Goals', accuracy: (aiPerformance?.weekly?.market_accuracy?.["home_goals"] || 0) * 0.85, predictions: Math.floor((aiPerformance?.weekly?.total_predictions || 0) * 0.7) },
                { market: 'Away Goals', accuracy: (aiPerformance?.weekly?.market_accuracy?.["away_goals"] || 0) * 0.85, predictions: Math.floor((aiPerformance?.weekly?.total_predictions || 0) * 0.7) },
              ]}
            />
          </div>
        </motion.div>
        
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
            <div
              className="relative h-32 cursor-pointer chart-glass"
              onClick={(e) => handleChartClick(e, { accuracy_percentage: aiPerformance.weekly_trend[aiPerformance.weekly_trend.length - 1]?.accuracy_percentage })}
            >
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

              {/* Mobile Tooltip */}
              {tooltip.visible && (
                <div
                  className="fixed bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm z-50 pointer-events-none border border-white/10"
                  style={{
                    left: `${tooltip.x}px`,
                    top: `${tooltip.y - 40}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {tooltip.content}
                </div>
              )}
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
              onClick={() => router.push("/ai-picks")}
              className="w-full rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
              style={{ background: "#111111" }}
            >
              <Sparkles size={20} style={{ color: "var(--brand-accent)" }} />
              <span className="text-xs font-bold text-white">AI Picks</span>
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

      {/* Avatar View Modal */}
      <AnimatePresence>
        {viewAvatarModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setViewAvatarModal({ isOpen: false, imageUrl: "" })}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={viewAvatarModal.imageUrl}
                alt="Profile Full Size"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setViewAvatarModal({ isOpen: false, imageUrl: "" })}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#111111] rounded-2xl p-6 max-w-md w-full border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 size={24} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Futa Akaunti</h2>
              </div>
              <p className="text-white/70 mb-6 leading-relaxed">
                Una hakika unataka kufuta akaunti yako? Hatua hii haiwezi kurudishwa. Data yote itafutwa pamoja na:
              </p>
              <ul className="text-white/60 mb-6 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Profile na avatar
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Predictions na track record
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Subscription na malipo
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Video na reactions
                </li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmModal(false)}
                  disabled={isDeletingAccount}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Ghairi
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Inafuta...
                    </>
                  ) : (
                    "Futa Akaunti"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}