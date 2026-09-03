'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Crown, Star, TrendingUp, Flame, Target, Award } from 'lucide-react'
import { getTipLeaderboard } from '@/lib/api/tips'

interface Tipster {
  rank: number
  user: {
    id: number
    username: string
    avatar_url?: string
    tipster_score?: number
    verified_tipster?: boolean
  }
  total_tips: number
  accuracy_percentage: number
  current_streak: number
  best_streak: number
  recent_form_correct: number
  recent_form_tips: number
}

export function TipstersLeaderboard() {
  const [tipsters, setTipsters] = useState<Tipster[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all')

  useEffect(() => {
    loadLeaderboard()
  }, [period])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('period', period)
      params.append('limit', '50')
      const data = await getTipLeaderboard(params)
      setTipsters(data.results || [])
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={20} className="text-yellow-400" />
      case 2:
        return <Medal size={20} className="text-gray-300" />
      case 3:
        return <Medal size={20} className="text-amber-600" />
      default:
        return <span className="text-sm font-bold text-white/60">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-400'
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-300 border-gray-200'
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-500 border-amber-400'
      default:
        return 'bg-gray-900/30 border-gray-700/30 hover:bg-gray-800/40'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white/50">Loading top tipsters...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy size={24} className="text-yellow-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Top Tipsters</h2>
            <p className="text-sm text-white/50">Best performers based on accuracy, tips count & streak</p>
          </div>
        </div>
        
        {/* Period Filter */}
        <div className="flex gap-2">
          {(['all', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {tipsters.map((tipster) => (
          <div
            key={tipster.user.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] ${getRankBadge(tipster.rank)}`}
          >
            {/* Rank */}
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              {getRankIcon(tipster.rank)}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {tipster.user.avatar_url ? (
                    <img
                      src={tipster.user.avatar_url}
                      alt={tipster.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {tipster.user.username[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                {tipster.user.verified_tipster && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                    <Award size={10} className="text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">@{tipster.user.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  {tipster.user.tipster_score && tipster.user.tipster_score >= 90 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                      <Star size={8} className="text-yellow-400" />
                      <span className="text-[10px] font-bold text-yellow-400">{tipster.user.tipster_score}</span>
                    </div>
                  )}
                  {tipster.current_streak >= 3 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full border border-orange-500/30">
                      <Flame size={8} className="text-orange-400" />
                      <span className="text-[10px] font-bold text-orange-400">{tipster.current_streak} streak</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-xs text-white/50">Accuracy</p>
                <p className="text-lg font-bold text-green-400">{tipster.accuracy_percentage}%</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Tips</p>
                <p className="text-lg font-bold text-white">{tipster.total_tips}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Best Streak</p>
                <p className="text-lg font-bold text-purple-400">{tipster.best_streak}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tipsters.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-gray-900/20 border border-gray-700/20">
          <Trophy size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-sm text-white/50">No tipsters found</p>
        </div>
      )}
    </div>
  )
}
