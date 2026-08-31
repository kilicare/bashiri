'use client'

import { useState, useEffect } from 'react'
import { getTipLeaderboard } from '@/lib/api/tips'
import { TipPerformance } from '@/lib/types/tips'
import { Trophy, Loader, ArrowLeft, TrendingUp, Calendar, Award, Flame, Target, Shield, Crown, Medal, Users, Star, Zap, Sparkles, Activity } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function LeaderboardPage() {
  const searchParams = useSearchParams()
  const [leaderboard, setLeaderboard] = useState<TipPerformance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all')
  const [market, setMarket] = useState<'all' | '1x2' | 'btts' | 'goals' | 'double_chance' | 'dnb'>('all')

  useEffect(() => {
    loadLeaderboard()
  }, [period, market])

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append('period', period)
      params.append('market', market)
      
      const data = await getTipLeaderboard(params)
      setLeaderboard(data.results || [])
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="text-yellow-400" size={24} />
    if (index === 1) return <Medal className="text-gray-300" size={20} />
    if (index === 2) return <Medal className="text-orange-600" size={18} />
    return null
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/20'
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-lg shadow-gray-300/20'
    if (index === 2) return 'bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg shadow-orange-500/20'
    return 'bg-white/10'
  }

  const getRankAccent = (index: number) => {
    if (index === 0) return 'from-yellow-400 to-amber-500'
    if (index === 1) return 'from-gray-300 to-gray-400'
    if (index === 2) return 'from-orange-600 to-orange-700'
    return 'from-blue-500 to-purple-600'
  }

  return (
    <div className="min-h-dvh px-5 pt-safe pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/tips"
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <Trophy size={32} className="text-yellow-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Tipster Rankings</h1>
              <p className="text-sm text-white/50">Verified analysts ranked by performance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Period Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-white/50" />
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Time Period</span>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  period === p.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Market Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-white/50" />
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Market Specialization</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All Markets' },
              { key: '1x2', label: '1X2' },
              { key: 'btts', label: 'BTTS' },
              { key: 'goals', label: 'Goals' },
              { key: 'double_chance', label: 'Double Chance' },
              { key: 'dnb', label: 'DNB' },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMarket(m.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  market === m.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading rankings...</p>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {!isLoading && leaderboard.length > 0 && (
        <div className="space-y-4">
          {leaderboard.map((tipster, index) => (
            <Link
              key={tipster.id}
              href={`/profile/${tipster.user.username}`}
            >
              <div className={`bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition cursor-pointer relative overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10`}>
                {/* Top 3 accent lines */}
                {index < 3 && (
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                    'bg-gradient-to-r from-orange-600 to-orange-700'
                  }`} />
                )}

                {/* Rank & User Info */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-black ${getRankBadge(index)} ring-4 ring-white/10`}>
                      {getRankIcon(index) || <span className="text-white text-lg">#{index + 1}</span>}
                    </div>
                    
                    {/* User Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-white/10 shadow-xl">
                        {tipster.user.avatar_url ? (
                          <img
                            src={tipster.user.avatar_url}
                            alt={tipster.user.username || 'user'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {tipster.user.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      {/* Verified badge */}
                      {tipster.user.verified_tipster && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 shadow-lg">
                          <Shield size={14} className="text-white" />
                        </div>
                      )}
                      {/* Top tipster badge */}
                      {tipster.tipster_score > 0 && tipster.tipster_score >= 90 && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
                          <Crown size={14} className="text-black" />
                        </div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <p className="text-xl font-bold text-white flex items-center gap-2">
                        @{tipster.user.username}
                        {tipster.tipster_score > 0 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                            <Star size={10} className="text-yellow-400" />
                            <span className="text-xs font-bold text-yellow-400">{tipster.tipster_score}</span>
                          </div>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {tipster.user.verified_tipster && (
                          <span className="text-xs text-blue-400 flex items-center gap-1 font-medium">
                            <Shield size={10} /> Verified
                          </span>
                        )}
                        <span className="text-xs text-white/50 flex items-center gap-1 font-medium">
                          <Users size={10} /> {tipster.user.followers_count} followers
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="text-4xl font-bold text-[var(--brand-accent)]">{tipster.accuracy_percentage}%</p>
                      {tipster.tipster_score > 0 && (
                        <div className="px-3 py-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                          <span className="text-sm font-bold text-blue-400 flex items-center gap-1">
                            <Star size={12} /> {tipster.tipster_score}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/50 font-medium mt-1">{tipster.total_tips} verified tips</p>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                    <p className="text-xs text-white/50 mb-2 flex items-center justify-center gap-1">
                      <Flame size={12} /> Streak
                    </p>
                    <p className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                      {tipster.current_streak}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                    <p className="text-xs text-white/50 mb-2 flex items-center justify-center gap-1">
                      <Award size={12} /> Best
                    </p>
                    <p className="text-2xl font-bold text-white">{tipster.best_streak}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                    <p className="text-xs text-white/50 mb-2 flex items-center justify-center gap-1">
                      <Activity size={12} /> Recent
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {tipster.recent_form_tips > 0 
                        ? `${tipster.recent_form_correct}/${tipster.recent_form_tips}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                    <p className="text-xs text-white/50 mb-2 flex items-center justify-center gap-1">
                      <Sparkles size={12} /> Upvotes
                    </p>
                    <p className="text-2xl font-bold text-white">{tipster.total_upvotes_received}</p>
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  {/* Market Specialization */}
                  {tipster.market_specialization && (
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-white/50" />
                        <span className="text-xs text-white/70">{tipster.market_specialization.market} Specialist</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--brand-accent)]">
                          {tipster.market_specialization.accuracy}%
                        </span>
                        <span className="text-xs text-white/50">
                          ({tipster.market_specialization.sample_size} tips)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* League Specialization */}
                  {tipster.league_specialization && (
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-white/50" />
                        <span className="text-xs text-white/70">{tipster.league_specialization.league} Specialist</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--brand-accent)]">
                          {tipster.league_specialization.accuracy}%
                        </span>
                        <span className="text-xs text-white/50">
                          ({tipster.league_specialization.sample_size} tips)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* No specialization yet */}
                  {!tipster.market_specialization && !tipster.league_specialization && (
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-xs text-white/50">
                        Not enough data for specialization yet (min 10 tips per market/league)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && leaderboard.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Trophy size={48} className="text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No rankings available</h3>
          <p className="text-white/50 mb-4">
            Try adjusting your filters or wait for more verified tips
          </p>
          <button
            onClick={() => {
              setPeriod('all')
              setMarket('all')
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}