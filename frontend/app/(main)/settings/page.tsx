"use client";
import { useRouter } from "next/navigation";
import { ChevronRight, Star, Bell, Globe, Heart, MessageSquare, HelpCircle, LogOut, Shield, Settings as SettingsIcon, ShieldAlert, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth.store";
import { PremiumButton } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useRef, useEffect } from "react";

const SETTINGS_ITEMS = [
  { 
    label: "Timu Ninazopenda", 
    href: "/settings/teams",
    icon: Star,
    description: "Manage your favorite teams"
  },
  { 
    label: "Ligi Ninazopenda", 
    href: "/settings/leagues",
    icon: Heart,
    description: "Select your preferred leagues"
  },
  { 
    label: "Notifications", 
    href: "/settings/notifications",
    icon: Bell,
    description: "Configure notification settings"
  },
  { 
    label: "Lugha (SW/EN)", 
    href: "/settings/language",
    icon: Globe,
    description: "Change app language"
  },
  { 
    label: "Wasiliana Nasi", 
    href: "/contact",
    icon: Phone,
    description: "Contact Bashiri team"
  },
  { 
    label: "Msaada na Maoni", 
    href: "/settings/support",
    icon: HelpCircle,
    description: "Get help or send feedback"
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([]);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleMouseDown = () => {
    setIsHolding(true);
    setHoldProgress(0);
    
    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return prev + 3.33; // 100% / 3 seconds = ~33.33% per second, / 10 for 100ms intervals
      });
    }, 100);

    // Hold timer for 3 seconds
    holdTimerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current!);
      triggerExplosion();
    }, 3000);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const triggerExplosion = () => {
    setIsExploding(true);
    
    // Create particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
    }));
    setParticles(newParticles);

    // Logout after explosion animation
    setTimeout(() => {
      handleLogout();
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[#050508] overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-white/50 mt-1">Personalize your experience</p>
      </div>

      <div className="px-3 pb-4">
        {/* Settings Items - Grid Layout like matches */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {SETTINGS_ITEMS.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (index * 0.05) }}
            >
              <GlassCard hover className="p-3">
                <button
                  onClick={() => router.push(item.href)}
                  className="w-full text-left"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F5A623]/10 to-[#E8892A]/5 border border-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                        <item.icon size={17} className="text-[#F5A623]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-white block truncate">{item.label}</span>
                      </div>
                      <ChevronRight size={15} className="text-white/30 flex-shrink-0" />
                    </div>
                    <span className="text-xs text-white/50 truncate pl-1">{item.description}</span>
                  </div>
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Account Section - Compact Glass Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/30 flex items-center justify-center">
                <Shield size={16} className="text-[var(--brand-accent)]" />
              </div>
              <p className="text-xs font-bold text-white">Account Information</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/50 mb-1 font-semibold">Phone</p>
                <p className="text-sm font-bold text-white truncate">{user?.phone_number || 'N/A'}</p>
              </div>

              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/50 mb-1 font-semibold">Username</p>
                <p className="text-sm font-bold text-white truncate">@{user?.username || 'User'}</p>
              </div>

              <div className="col-span-2 p-2 rounded-lg bg-green-500/10 border border-green-400/30">
                <p className="text-xs text-white/50 mb-1 font-semibold">Status</p>
                <p className="text-sm font-bold text-green-400">✓ Active</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* SOS Logout Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <div className="relative">
            {/* Ripple/Radar Animation */}
            <AnimatePresence>
              {isHolding && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 3, opacity: 0 }}
                      exit={{ scale: 3, opacity: 0 }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        delay: i * 0.3,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 rounded-full border-2 border-red-500/50"
                      style={{ width: '100%', height: '100%' }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* SOS Button */}
            <motion.button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              disabled={isExploding}
              whileHover={{ scale: isHolding ? 1 : 1.05 }}
              whileTap={{ scale: isHolding ? 0.95 : 0.95 }}
              animate={{ 
                scale: isExploding ? 0 : 1,
                opacity: isExploding ? 0 : 1
              }}
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #ef4444, #dc2626, #991b1b)',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.3)',
              }}
              className="relative flex flex-col items-center justify-center gap-1 overflow-hidden"
            >
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" style={{ width: '140px', height: '140px' }}>
                <circle
                  cx="70"
                  cy="70"
                  r="65"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="70"
                  cy="70"
                  r="65"
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="408"
                  strokeDashoffset={408 - (408 * holdProgress / 100)}
                  animate={{ strokeDashoffset: 408 - (408 * holdProgress / 100) }}
                  transition={{ duration: 0.1 }}
                  style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' }}
                />
              </svg>

              {/* Shield Icon */}
              <motion.div
                animate={{ 
                  scale: isHolding ? [1, 1.15, 1] : 1,
                  rotate: isHolding ? [0, -8, 8, 0] : 0
                }}
                transition={{ 
                  duration: isHolding ? 0.4 : 0.3,
                  repeat: isHolding ? Infinity : 0
                }}
              >
                <ShieldAlert size={36} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              </motion.div>

              {/* LOGOUT Text */}
              <span className="text-lg font-black tracking-widest" style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                LOGOUT
              </span>

              {/* Hold Text */}
              <motion.span
                animate={{ opacity: isHolding ? 0 : 1 }}
                className="text-[11px] font-semibold"
                style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
              >
                Hold 3s
              </motion.span>
            </motion.button>

            {/* Explosion Particles */}
            <AnimatePresence>
              {isExploding && particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ 
                    x: particle.x, 
                    y: particle.y,
                    scale: 1,
                    opacity: 1
                  }}
                  animate={{
                    x: particle.x + particle.vx * 50,
                    y: particle.y + particle.vy * 50,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  style={{
                    left: particle.x,
                    top: particle.y,
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Screen Flash */}
            <AnimatePresence>
              {isExploding && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="fixed inset-0 bg-red-500 pointer-events-none z-50"
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      <div className="px-3 pb-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-white/40"
        >
          Hold the LOGOUT button for 3 seconds to logout
        </motion.p>
      </div>
    </div>
  );
}