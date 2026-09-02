'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Target, Crown, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BestStreakCardProps {
  data?: any;
}

export function BestStreakCard({ data }: BestStreakCardProps) {
  const router = useRouter()

  if (!data) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/profile/${data.username}`)}
      className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-5 border border-orange-500/30 cursor-pointer hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all relative overflow-hidden"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pt-2">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-400" />
          <span className="text-sm font-bold text-white/90">Best Streak</span>
        </div>
        {data.verified_tipster && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
            <Crown size={10} className="text-blue-400" />
            <span className="text-[11px] font-bold text-blue-400">Verified</span>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center ring-2 ring-orange-500/30 shadow-lg">
            {data.avatar_url ? (
              <img
                src={data.avatar_url}
                alt={data.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-white">
                {data.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          {/* Streak flame */}
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1.5 shadow-lg">
            <Flame size={10} className="text-white" />
          </div>
        </div>
        <div>
          <p className="text-[17px] font-bold text-white mb-1">@{data.username}</p>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-white/50">
              {data.total_tips} tips
            </span>
            <span className="text-[12px] text-white/30">•</span>
            <span className="text-[12px] text-green-400 font-medium">
              {data.accuracy}% accuracy
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <p className="text-[13px] text-white/50 mb-1">Best Streak</p>
          <p className="text-[24px] font-bold text-orange-400 leading-none">{data.best_streak}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <p className="text-[13px] text-white/50 mb-1">Current Streak</p>
          <p className="text-[24px] font-bold text-white leading-none">{data.current_streak}</p>
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}
