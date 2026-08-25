'use client'

import { motion } from 'framer-motion'
import { UserTipList } from '@/lib/types/tips'
import { TrendingUp, Eye, ThumbsUp, MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface TipCardProps {
  tip: UserTipList
  onClick?: () => void
  showTeams?: boolean
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-500/20 text-yellow-400',
    icon: Clock,
  },
  CORRECT: {
    label: '✅ Won',
    color: 'bg-green-500/20 text-green-400',
    icon: CheckCircle,
  },
  INCORRECT: {
    label: '❌ Lost',
    color: 'bg-red-500/20 text-red-400',
    icon: XCircle,
  },
  VOID: {
    label: 'Void',
    color: 'bg-gray-500/20 text-gray-400',
    icon: Clock,
  },
}

export function TipCard({ tip, onClick, showTeams = true }: TipCardProps) {
  const status = statusConfig[tip.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border border-white/10 cursor-pointer hover:border-blue-500/50 transition-all"
    >
      {/* Header: User & Status */}
      <div className="flex items-center justify-between mb-3">
        <Link
          href={`/profile/${tip.user.username}`}
          className="flex items-center gap-2 hover:opacity-80 transition"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            {tip.user.avatar_url ? (
              <img
                src={tip.user.avatar_url}
                alt={tip.user.username || 'user'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {tip.user.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white">@{tip.user.username}</p>
            {tip.user.verified_tipster && (
              <p className="text-xs text-blue-400">✓ Verified</p>
            )}
          </div>
        </Link>

        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status.color}`}>
          <StatusIcon size={14} />
          {status.label}
        </span>
      </div>

      {/* Match Info */}
      {showTeams && (
        <div className="mb-3 pb-3 border-b border-white/10">
          <p className="text-xs text-white/50 mb-1">{tip.league_name}</p>
          <p className="text-sm font-bold text-white">
            {tip.home_team} vs {tip.away_team}
          </p>
        </div>
      )}

      {/* Prediction */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">Prediction</p>
          <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded">
            <TrendingUp size={12} className="text-blue-400" />
            <span className="text-xs font-bold text-blue-400">{tip.confidence}%</span>
          </div>
        </div>
        <p className="text-sm font-bold text-white mt-1">
          {tip.selection_label} • {tip.market_label}
        </p>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-white/50 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1">
          <Eye size={14} />
          <span>{tip.views_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsUp size={14} />
          <span>{tip.upvotes_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle size={14} />
          <span>{tip.comments_count}</span>
        </div>
        <div className="ml-auto text-xs text-white/40">
          {formatDistanceToNow(new Date(tip.created_at), {
            addSuffix: true,
          })}
        </div>
      </div>
    </motion.div>
  )
}
