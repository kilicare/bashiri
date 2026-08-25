'use client'

import { useParams } from 'next/navigation'
import { useFetchTip, useVoteTip, useShareTip } from '@/hooks/useTips'
import { useTipsRealtime } from '@/hooks/useTipsRealtime'
import { useTipsStore } from '@/stores/tips.store'
import { TipComments } from '@/components/tips/TipComments'
import { TipStats } from '@/components/tips/TipStats'
import { ThumbsUp, Share2, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PremiumButton } from '@/components/ui/Button'

export default function TipDetailPage() {
  const params = useParams()
  const tipId = parseInt(params.id as string)
  const { selectedTip, error, isLoading } = useTipsStore()
  const { vote, isLoading: isVoting } = useVoteTip(tipId)
  const { share, isLoading: isSharing } = useShareTip(tipId)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useFetchTip(tipId)
  const { isConnected } = useTipsRealtime(tipId)

  if (isLoading) {
    return <div className="text-center py-12 text-white/50">Loading...</div>
  }

  if (error || !selectedTip) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 mb-4">{error || 'Tip not found'}</p>
        <Link href="/tips" className="text-blue-400 hover:underline">
          Back to tips
        </Link>
      </div>
    )
  }

  const handleVote = async (voteType: 'UP' | 'DOWN') => {
    await vote(voteType)
  }

  const handleShare = async (platform: string) => {
    await share(platform as any)
    setShowShareMenu(false)
  }

  return (
    <div className="min-h-dvh px-5 pt-safe pb-24">
      {/* Connection indicator */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
        <span className="text-xs text-white/50">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/tips"
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Tip Details</h1>
        </div>
      </div>

      {/* Tip Card */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border border-white/10 mb-6">
        {/* User Info */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/profile/${selectedTip.user.username}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold">
                {selectedTip.user.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">@{selectedTip.user.username}</p>
              <p className="text-xs text-white/50">
                Accuracy: {selectedTip.user.tip_accuracy.toFixed(1)}%
              </p>
            </div>
          </Link>
        </div>

        {/* Match Info */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <p className="text-xs text-white/50 mb-2">{selectedTip.match.league_name}</p>
          <p className="text-xl font-bold text-white mb-2">
            {selectedTip.match.home_team_name} vs {selectedTip.match.away_team_name}
          </p>
          <p className="text-sm text-white/70">
            {new Date(selectedTip.match.kickoff_at).toLocaleString()}
          </p>
        </div>

        {/* Prediction */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs text-white/50 mb-2">Market</p>
            <p className="text-lg font-bold text-white">{selectedTip.market_label}</p>
          </div>

          <div>
            <p className="text-xs text-white/50 mb-2">Prediction</p>
            <p className="text-2xl font-bold text-blue-400">{selectedTip.selection_label}</p>
          </div>

          <div>
            <p className="text-xs text-white/50 mb-2">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                  style={{ width: `${selectedTip.confidence}%` }}
                />
              </div>
              <span className="text-lg font-bold text-white">{selectedTip.confidence}%</span>
            </div>
          </div>

          {selectedTip.reasoning && (
            <div>
              <p className="text-xs text-white/50 mb-2">Analysis</p>
              <p className="text-white/80">{selectedTip.reasoning}</p>
            </div>
          )}
        </div>

        {/* Engagement Actions */}
        <div className="flex gap-3 mb-6">
          <PremiumButton
            onClick={() => handleVote('UP')}
            disabled={isVoting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition disabled:opacity-50"
          >
            <ThumbsUp size={18} />
            {selectedTip.upvotes_count}
          </PremiumButton>

          <PremiumButton
            onClick={() => handleVote('DOWN')}
            disabled={isVoting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition disabled:opacity-50"
          >
            <MessageCircle size={18} />
            {selectedTip.comments_count}
          </PremiumButton>

          <div className="relative flex-1">
            <PremiumButton
              onClick={() => setShowShareMenu(!showShareMenu)}
              disabled={isSharing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition disabled:opacity-50"
            >
              <Share2 size={18} />
            </PremiumButton>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute bottom-12 right-0 bg-gray-900 border border-white/10 rounded-lg overflow-hidden z-10">
                {[
                  { name: 'WhatsApp', platform: 'WHATSAPP' },
                  { name: 'Twitter', platform: 'TWITTER' },
                  { name: 'Copy Link', platform: 'COPY' },
                ].map((option) => (
                  <button
                    key={option.platform}
                    onClick={() => handleShare(option.platform)}
                    className="w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div className="text-xs text-white/50">
            {selectedTip.status === 'PENDING' && '⏳ Pending'}
            {selectedTip.status === 'CORRECT' && '✅ Correct'}
            {selectedTip.status === 'INCORRECT' && '❌ Incorrect'}
            {selectedTip.status === 'VOID' && '⚠️ Void'}
          </div>
          <p className="text-xs text-white/50">{selectedTip.views_count} views</p>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border border-white/10">
        <TipComments tip={selectedTip} />
      </div>
    </div>
  )
}
