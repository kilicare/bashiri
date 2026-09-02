'use client'

import { motion } from 'framer-motion'
import { UserTipList } from '@/lib/types/tips'
import { TrendingUp, Eye, ThumbsUp, MessageCircle, CheckCircle, XCircle, Clock, Brain, Flame, Target, Shield, Star, Crown, Zap, Award } from 'lucide-react'
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
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock,
    bgGradient: 'from-yellow-500/10 to-orange-500/10',
  },
  CORRECT: {
    label: '✅ Won',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle,
    bgGradient: 'from-green-500/10 to-emerald-500/10',
  },
  INCORRECT: {
    label: '❌ Lost',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
    bgGradient: 'from-red-500/10 to-rose-500/10',
  },
  VOID: {
    label: 'Void',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: Clock,
    bgGradient: 'from-gray-500/10 to-slate-500/10',
  },
}

export function TipCard({ tip, onClick, showTeams = true }: TipCardProps) {
  const status = statusConfig[tip.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  // Calculate engagement level for visual indicator
  const engagementLevel = tip.upvotes_count > 10 ? 'high' : tip.upvotes_count > 5 ? 'medium' : 'low'
  
  // Show verified badge if user is verified tipster
  const showVerifiedBadge = tip.user.verified_tipster && tip.user.total_tips >= 10
  
  // Check if tipster is in top 10
  const isTopTipster = tip.user.tipster_score > 0 && tip.user.tipster_score >= 90
  
  // Hot form indicator
  const isHotForm = tip.user.tip_accuracy > 70 && tip.user.total_tips >= 10 && tip.user.current_streak >= 3
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-[#111111] rounded-2xl p-5 border border-white/10 cursor-pointer hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10 transition-all relative overflow-hidden"
    >
      {/* Top tipster badge */}
      {isTopTipster && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-lg">
          <Crown size={10} />
          TOP
        </div>
      )}

      {/* Top Row: User & Status */}
      <div className="flex items-start justify-between mb-5">
        <Link
          href={`/profile/${tip.user.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition group"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-orange-500/50 transition shadow-lg">
              {tip.user.avatar_url ? (
                <img
                  src={tip.user.avatar_url}
                  alt={tip.user.username || 'user'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-base font-bold text-white">
                  {tip.user.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {/* Hot form indicator */}
            {isHotForm && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1.5 shadow-lg">
                <Flame size={10} className="text-white" />
              </div>
            )}
            {/* Verified badge */}
            {tip.user.verified_tipster && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 shadow-lg">
                <Shield size={10} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="text-[15px] font-bold text-white group-hover:text-orange-400 transition flex items-center gap-2">
              @{tip.user.username}
              {tip.user.tipster_score > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                  <Star size={8} className="text-yellow-400" />
                  <span className="text-[11px] font-bold text-yellow-400">{tip.user.tipster_score}</span>
                </div>
              )}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {tip.user.verified_tipster && (
                <span className="text-[12px] text-blue-400 flex items-center gap-1 font-medium">
                  <Target size={10} /> Verified
                </span>
              )}
              <span className="text-[12px] text-white/50 font-medium">
                {tip.user.tip_accuracy.toFixed(1)}% • {tip.user.total_tips} tips
              </span>
            </div>
          </div>
        </Link>

        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${status.color}`}>
          <StatusIcon size={11} />
          {status.label}
        </span>
      </div>

      {/* Match Section */}
      {showTeams && (
        <div className="mb-5">
          <p className="text-[12px] text-white/50 mb-2 flex items-center gap-1.5 font-medium uppercase tracking-wider">
            <Target size={10} />
            {tip.league_name}
          </p>
          <p className="text-[17px] font-bold text-white leading-tight mb-2">
            {tip.home_team} vs {tip.away_team}
          </p>
          {tip.kickoff_at && (
            <p className="text-[12px] text-white/40 flex items-center gap-1">
              <Clock size={10} />
              {new Date(tip.kickoff_at).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}
        </div>
      )}

      {/* Prediction Section */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] text-white/50 uppercase tracking-wider font-bold">Prediction</p>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
            tip.confidence >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            tip.confidence >= 60 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            tip.confidence >= 40 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <TrendingUp size={12} />
            <span className="text-[12px] font-bold">{tip.confidence}%</span>
          </div>
        </div>
        <p className="text-[19px] font-bold text-white leading-tight">
          <span className="text-orange-400">{tip.selection_label}</span>
          <span className="text-white/50 mx-2">•</span>
          <span className="text-white/70">{tip.market_label}</span>
        </p>
      </div>

      {/* AI Agreement */}
      {tip.ai_agrees !== null && (
        <div className={`mb-5 flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
          tip.ai_agrees 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          {tip.ai_agrees ? (
            <Brain className="text-green-400" size={16} />
          ) : (
            <Zap className="text-orange-400" size={16} />
          )}
          <span className="text-[13px] font-bold text-white">
            {tip.ai_agrees ? 'AI AGREES' : 'CONTRARIAN'}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 text-[12px] text-white/50 pt-4 border-t border-white/10">
        <div className="flex items-center gap-1.5 hover:text-white/70 transition cursor-pointer group">
          <Eye size={14} className="group-hover:text-blue-400 transition" />
          <span className="font-medium">{tip.views_count}</span>
        </div>
        <div className={`flex items-center gap-1.5 hover:text-white/70 transition cursor-pointer group ${
          engagementLevel === 'high' ? 'text-green-400' :
          engagementLevel === 'medium' ? 'text-blue-400' : ''
        }`}>
          <ThumbsUp size={14} className="group-hover:text-green-400 transition" />
          <span className="font-medium">{tip.upvotes_count}</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-white/70 transition cursor-pointer group">
          <MessageCircle size={14} className="group-hover:text-purple-400 transition" />
          <span className="font-medium">{tip.comments_count}</span>
        </div>
        <div className="ml-auto text-[12px] text-white/40 flex items-center gap-1.5">
          <Clock size={12} />
          <span className="font-medium">{formatDistanceToNow(new Date(tip.created_at), {
            addSuffix: true,
          })}</span>
        </div>
      </div>
    </motion.div>
  )
}