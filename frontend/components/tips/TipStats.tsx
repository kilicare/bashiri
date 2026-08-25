'use client'

import { TipPerformance } from '@/lib/types/tips'
import { TrendingUp, Trophy, Flame, Target } from 'lucide-react'

interface TipStatsProps {
  performance: TipPerformance
}

export function TipStats({ performance }: TipStatsProps) {
  const stats = [
    {
      icon: Target,
      label: 'Accuracy',
      value: `${performance.accuracy_percentage.toFixed(1)}%`,
      color: 'text-blue-400',
    },
    {
      icon: TrendingUp,
      label: 'Total Tips',
      value: performance.total_tips,
      color: 'text-purple-400',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: performance.current_streak,
      color: 'text-orange-400',
    },
    {
      icon: Trophy,
      label: 'Best Streak',
      value: performance.best_streak,
      color: 'text-yellow-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => {
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
  )
}
