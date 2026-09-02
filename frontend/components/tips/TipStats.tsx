'use client'

import { TipPerformance, UserTip, UserTipList } from '@/lib/types/tips'
import { TrendingUp, Trophy, Flame, Target, Award, Zap, CheckCircle, XCircle, Clock } from 'lucide-react'

interface TipStatsProps {
  tip?: UserTip
  performance?: TipPerformance
  userTips?: UserTipList[]
}

export function TipStats({ tip, performance, userTips }: TipStatsProps) {
  // If no performance data, show empty state or minimal tip info
  if (!performance && !tip && !userTips) {
    return null
  }

  // Calculate stats from userTips if provided, otherwise use performance or fallback to tip user object
  let stats: {
    accuracy_percentage: number
    total_tips: number
    current_streak: number
    best_streak: number
    correct_tips: number
    incorrect_tips: number
    void_tips: number
    accuracy_1x2: number
    tips_1x2: number
    accuracy_btts: number
    tips_btts: number
    accuracy_over_under: number
    tips_over_under: number
    accuracy_double_chance: number
    tips_double_chance: number
    accuracy_dnb: number
    tips_dnb: number
    recent_form_tips: number
    recent_form_correct: number
    tipster_score: number
    tipster_score_version: string
  }

  if (userTips && userTips.length > 0) {
    const correctTips = userTips.filter((t: any) => t.status === 'CORRECT').length
    const incorrectTips = userTips.filter((t: any) => t.status === 'INCORRECT').length
    const voidTips = userTips.filter((t: any) => t.status === 'VOID').length
    const settledCount = correctTips + incorrectTips
    const accuracy = settledCount > 0 ? Math.round((correctTips / settledCount) * 100) : 0

    // Calculate streak
    let currentStreak = 0
    let bestStreak = 0
    const sortedTips = [...userTips].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    for (const t of sortedTips) {
      if (t.status === 'CORRECT') {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else if (t.status === 'INCORRECT') {
        currentStreak = 0
      }
    }

    stats = {
      accuracy_percentage: accuracy,
      total_tips: userTips.length,
      current_streak: currentStreak,
      best_streak: bestStreak,
      correct_tips: correctTips,
      incorrect_tips: incorrectTips,
      void_tips: voidTips,
      accuracy_1x2: 0,
      tips_1x2: 0,
      accuracy_btts: 0,
      tips_btts: 0,
      accuracy_over_under: 0,
      tips_over_under: 0,
      accuracy_double_chance: 0,
      tips_double_chance: 0,
      accuracy_dnb: 0,
      tips_dnb: 0,
      recent_form_tips: Math.min(10, userTips.length),
      recent_form_correct: userTips.slice(0, 10).filter((t: any) => t.status === 'CORRECT').length,
      tipster_score: tip?.user?.tipster_score || 0,
      tipster_score_version: 'v1',
    }
  } else {
    // Use performance data if available, otherwise extract from tip
    stats = performance || {
      accuracy_percentage: tip?.user?.tip_accuracy || 0,
      total_tips: tip?.user?.total_tips || 0,
      current_streak: tip?.user?.current_streak || 0,
      best_streak: tip?.user?.best_streak || 0,
      correct_tips: 0,
      incorrect_tips: 0,
      void_tips: 0,
      accuracy_1x2: 0,
      tips_1x2: 0,
      accuracy_btts: 0,
      tips_btts: 0,
      accuracy_over_under: 0,
      tips_over_under: 0,
      accuracy_double_chance: 0,
      tips_double_chance: 0,
      accuracy_dnb: 0,
      tips_dnb: 0,
      recent_form_tips: 0,
      recent_form_correct: 0,
      tipster_score: tip?.user?.tipster_score || 0,
      tipster_score_version: 'v1',
    }
  }

  const coreStats = [
    {
      icon: Target,
      label: 'Accuracy',
      value: `${stats.accuracy_percentage.toFixed(1)}%`,
      color: 'text-blue-400',
    },
    {
      icon: TrendingUp,
      label: 'Total Tips',
      value: stats.total_tips,
      color: 'text-purple-400',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: stats.current_streak,
      color: 'text-orange-400',
    },
    {
      icon: Trophy,
      label: 'Best Streak',
      value: stats.best_streak,
      color: 'text-yellow-400',
    },
  ]

  const resultBreakdown = [
    {
      label: 'Correct',
      value: stats.correct_tips,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
    },
    {
      label: 'Incorrect',
      value: stats.incorrect_tips,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
    },
    {
      label: 'Void',
      value: stats.void_tips,
      color: 'text-gray-400',
      bg: 'bg-gray-500/20',
    },
  ]

  const marketStats = [
    {
      label: '1X2',
      accuracy: stats.accuracy_1x2,
      tips: stats.tips_1x2,
    },
    {
      label: 'BTTS',
      accuracy: stats.accuracy_btts,
      tips: stats.tips_btts,
    },
    {
      label: 'Goals',
      accuracy: stats.accuracy_over_under,
      tips: stats.tips_over_under,
    },
    {
      label: 'Double Chance',
      accuracy: stats.accuracy_double_chance,
      tips: stats.tips_double_chance,
    },
    {
      label: 'DNB',
      accuracy: stats.accuracy_dnb,
      tips: stats.tips_dnb,
    },
  ].filter(m => m.tips > 0)

  return (
    <div className="space-y-6">
      {/* Core Stats */}
      <div className="grid grid-cols-2 gap-3">
        {coreStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-white/10 to-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={stat.color} />
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Result Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-white/50" />
          <p className="text-sm font-bold text-white">Performance Breakdown</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {resultBreakdown.map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-lg p-3 text-center`}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className={`text-xs ${stat.color}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Form */}
      {stats.recent_form_tips > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-white/50" />
            <p className="text-sm font-bold text-white">Recent Form (Last 10)</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/50">Recent Performance</span>
              <span className="text-sm font-bold text-white">
                {stats.recent_form_correct}/{stats.recent_form_tips}
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: stats.recent_form_tips }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    i < stats.recent_form_correct
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {i < stats.recent_form_correct ? '✓' : '✗'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Market Specialization */}
      {marketStats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-white/50" />
            <p className="text-sm font-bold text-white">Market Performance</p>
          </div>
          <div className="space-y-2">
            {marketStats.map((market) => (
              <div key={market.label} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">{market.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-400">
                      {market.accuracy.toFixed(1)}%
                    </span>
                    <span className="text-xs text-white/50">
                      ({market.tips} tips)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                    style={{ width: `${market.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tipster Score */}
      {stats.tipster_score > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-yellow-400" />
            <p className="text-sm font-bold text-white">Tipster Score</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-yellow-400">{stats.tipster_score}</p>
                <p className="text-xs text-white/50 mt-1">
                  Version: {stats.tipster_score_version}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Calculated using</p>
                <p className="text-xs text-white/70">Wilson interval</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
