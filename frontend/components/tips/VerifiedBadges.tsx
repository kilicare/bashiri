'use client'

import { TipPerformance } from '@/lib/types/tips'
import { Shield, Flame, Target, Award, Brain, Trophy, Zap, Star } from 'lucide-react'

interface Badge {
  icon: any
  label: string
  color: string
  bgColor: string
  description: string
}

export function getVerifiedBadges(performance: TipPerformance): Badge[] {
  const badges: Badge[] = []

  // Verified Tipster Badge (requires minimum tips and score)
  if (performance.total_tips >= 10 && performance.tipster_score >= 50) {
    badges.push({
      icon: Shield,
      label: 'Verified Tipster',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      description: 'Consistent performance with proven track record',
    })
  }

  // Hot Form Badge (recent strong performance)
  if (performance.recent_form_tips >= 5) {
    const recentAccuracy = (performance.recent_form_correct / performance.recent_form_tips) * 100
    if (recentAccuracy >= 70) {
      badges.push({
        icon: Flame,
        label: 'Hot Form',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        description: 'Strong recent performance',
      })
    }
  }

  // Market Specialist Badges (from backend specialization)
  if (performance.market_specialization) {
    badges.push({
      icon: Target,
      label: `${performance.market_specialization.market} Specialist`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      description: `${performance.market_specialization.accuracy}% accuracy in ${performance.market_specialization.market}`,
    })
  }

  // League Specialist Badges (from backend specialization)
  if (performance.league_specialization) {
    badges.push({
      icon: Award,
      label: `${performance.league_specialization.league} Specialist`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      description: `${performance.league_specialization.accuracy}% accuracy in ${performance.league_specialization.league}`,
    })
  }

  // AI Aligned Badge (would need to be calculated from AI snapshot data)
  // This would require additional backend data to calculate overall AI agreement rate

  // Top Performer Badge (high tipster score)
  if (performance.tipster_score >= 80) {
    badges.push({
      icon: Trophy,
      label: 'Top Performer',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      description: 'Exceptional tipster score',
    })
  }

  // Rising Star Badge (good accuracy with growing sample size)
  if (performance.total_tips >= 20 && performance.accuracy_percentage >= 65 && performance.tipster_score >= 60) {
    badges.push({
      icon: Star,
      label: 'Rising Star',
      color: 'text-yellow-300',
      bgColor: 'bg-yellow-500/20',
      description: 'Strong performer with growing track record',
    })
  }

  // High Volume Badge (consistent tipping)
  if (performance.total_tips >= 50) {
    badges.push({
      icon: Zap,
      label: 'High Volume',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      description: 'Consistent tipster with high volume',
    })
  }

  return badges
}

interface VerifiedBadgesProps {
  performance: TipPerformance
  maxBadges?: number
}

export function VerifiedBadges({ performance, maxBadges = 4 }: VerifiedBadgesProps) {
  const badges = getVerifiedBadges(performance)
  const displayBadges = badges.slice(0, maxBadges)

  if (displayBadges.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-4 text-center">
        <p className="text-sm text-white/50">
          Earn badges by posting verified tips and building your track record
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {displayBadges.map((badge) => {
        const Icon = badge.icon
        return (
          <div
            key={badge.label}
            className={`${badge.bgColor} rounded-lg p-3 border border-white/10`}
          >
            <div className="flex items-center gap-2">
              <Icon size={16} className={badge.color} />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{badge.label}</p>
                <p className="text-xs text-white/50">{badge.description}</p>
              </div>
            </div>
          </div>
        )
      })}
      {badges.length > maxBadges && (
        <p className="text-xs text-white/50 text-center">
          +{badges.length - maxBadges} more badges
        </p>
      )}
    </div>
  )
}