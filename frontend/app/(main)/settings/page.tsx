"use client";
import { useRouter } from "next/navigation";
import { ChevronRight, Star, Bell, Globe, Heart, MessageSquare, HelpCircle, LogOut, Shield, Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth.store";
import { PremiumButton } from "@/components/ui/Button";

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
    label: "Msaada na Maoni", 
    href: "/settings/support",
    icon: HelpCircle,
    description: "Get help or send feedback"
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-[#050508] overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-5 pt-safe pt-6 pb-4">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-white/50 mt-1">Personalize your experience</p>
      </div>

      <div className="px-5 space-y-4 pb-8">
        {/* Settings Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {SETTINGS_ITEMS.map((item, index) => (
            <motion.button
              key={item.href}
              onClick={() => router.push(item.href)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (index * 0.05) }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full rounded-2xl p-4 flex items-center gap-4 bg-[#1A1A24] border border-white/10 hover:bg-[#22222E] hover:border-white/20 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5A623]/10 to-[#E8892A]/5 border border-[#F5A623]/20 flex items-center justify-center group-hover:bg-[#F5A623]/20 transition-colors">
                <item.icon size={20} className="text-[#F5A623]" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-semibold text-white block">{item.label}</span>
                <span className="text-xs text-white/40">{item.description}</span>
              </div>
              <ChevronRight size={18} className="text-white/30 group-hover:text-white/60 transition-colors" />
            </motion.button>
          ))}
        </motion.div>

        {/* Account Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A1A24] to-[#22222E] border border-white/10 p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Shield size={18} className="text-purple-400" />
            </div>
            <p className="text-sm font-bold text-white">Account Information</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/40 mb-1 font-semibold">Phone Number</p>
              <p className="text-sm font-bold text-white truncate">{user?.phone_number || 'N/A'}</p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/40 mb-1 font-semibold">Username</p>
              <p className="text-sm font-bold text-white truncate">@{user?.username || 'User'}</p>
            </div>

            <div className="col-span-2 p-3 rounded-xl bg-green-500/10 border border-green-400/30">
              <p className="text-xs text-white/40 mb-1 font-semibold">Status</p>
              <p className="text-sm font-bold text-green-400">✓ Active</p>
            </div>
          </div>
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
            onClick={handleLogout}
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