'use client'

import { useFetchLeaderboard } from '@/hooks/useTips'
import { useTipsRealtime } from '@/hooks/useTipsRealtime'
import { useLeaderboard, useTipsLoading } from '@/stores/tips.store'
import { TipStats } from '@/components/tips/TipStats'
import { Trophy, Loader, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LeaderboardPage() {
  useFetchLeaderboard()
  const { isConnected } = useTipsRealtime()  // Subscribes to leaderboard updates
  const leaderboard = useLeaderboard()
  const isLoading = useTipsLoading()

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
            <h1 className="text-3xl font-bold text-white">Tipster Rankings</h1>
          </div>
        </div>
        
        {/* Connection indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-xs text-white/50">
            {isConnected ? 'Live updates' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader size={40} className="text-blue-500 animate-spin" />
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
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-4 border border-white/10 hover:border-blue-500/50 transition cursor-pointer">
                {/* Rank & User */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 font-bold text-black">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">@{tipster.user.username}</p>
                      {tipster.user.verified_tipster && (
                        <p className="text-xs text-blue-400">✓ Verified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <TipStats performance={tipster} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && leaderboard.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No tipsters yet</p>
        </div>
      )}
    </div>
  )
}
