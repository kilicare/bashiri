'use client'

import { useParams } from 'next/navigation'
import { useFetchTip, useVoteTip, useShareTip } from '@/hooks/useTips'
import { useTipsRealtime } from '@/hooks/useTipsRealtime'
import { useTipsStore } from '@/stores/tips.store'
import { TipComments } from '@/components/tips/TipComments'
import { TipStats } from '@/components/tips/TipStats'
import { ThumbsUp, Share2, MessageCircle, ArrowLeft, Brain, TrendingUp, Target, Flame, Clock, CheckCircle, XCircle, Shield, Users, Award, Crown, Star, Zap, BarChart3, PieChart, Activity, Eye } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PremiumButton } from '@/components/ui/Button'
import { formatDistanceToNow } from 'date-fns'

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
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/50">Loading tip details...</p>
        </div>
      </div>
    )
  }

  if (error || !selectedTip) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Target size={40} className="text-white/30" />
          </div>
          <p className="text-white/50 mb-4">{error || 'Tip not found'}</p>
          <Link href="/tips" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition">
            Back to tips
          </Link>
        </div>
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

  const statusConfig = {
    PENDING: { icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' },
    CORRECT: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' },
    INCORRECT: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' },
    VOID: { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/30' },
  }

  const status = statusConfig[selectedTip.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  return (
    <div className="min-h-dvh px-5 pt-safe pb-24">
      {/* Connection indicator */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
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
          <h1 className="text-2xl font-bold text-white">Tip Analysis</h1>
          <p className="text-sm text-white/50">Detailed breakdown and verification</p>
        </div>
      </div>

      {/* Main Tip Card */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 border border-white/10 mb-6 shadow-2xl">
        {/* User Info with Tipster Stats */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
          <Link
            href={`/profile/${selectedTip.user.username}`}
            className="flex items-center gap-4 hover:opacity-80 transition group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-white/10 group-hover:ring-blue-500/50 transition shadow-xl">
                {selectedTip.user.avatar_url ? (
                  <img
                    src={selectedTip.user.avatar_url}
                    alt={selectedTip.user.username || 'user'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {selectedTip.user.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {/* Verified badge */}
              {selectedTip.user.verified_tipster && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 shadow-lg">
                  <Shield size={14} className="text-white" />
                </div>
              )}
              {/* Top tipster badge */}
              {selectedTip.user.tipster_score > 0 && selectedTip.user.tipster_score >= 90 && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
                  <Crown size={14} className="text-black" />
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-white group-hover:text-blue-400 transition flex items-center gap-2">
                @{selectedTip.user.username}
                {selectedTip.user.tipster_score > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                    <Star size={10} className="text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">{selectedTip.user.tipster_score}</span>
                  </div>
                )}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {selectedTip.user.verified_tipster && (
                  <span className="text-xs text-blue-400 flex items-center gap-1 font-medium">
                    <Shield size={10} /> Verified
                  </span>
                )}
                <span className="text-xs text-white/50 font-medium">
                  {selectedTip.user.total_tips} tips
                </span>
                <span className="text-xs text-white/50 font-medium">
                  {selectedTip.user.tip_accuracy.toFixed(1)}% accuracy
                </span>
                {selectedTip.user.current_streak >= 3 && (
                  <span className="text-xs text-orange-400 flex items-center gap-1 font-medium">
                    <Flame size={10} /> {selectedTip.user.current_streak} streak
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Status Badge */}
          <div className={`px-5 py-2.5 rounded-full border shadow-lg ${status.bgColor} ${status.borderColor}`}>
            <div className="flex items-center gap-2">
              <StatusIcon size={18} className={status.color} />
              <span className="text-sm font-bold text-white">
                {selectedTip.status === 'PENDING' && 'PENDING'}
                {selectedTip.status === 'CORRECT' && 'WON'}
                {selectedTip.status === 'INCORRECT' && 'LOST'}
                {selectedTip.status === 'VOID' && 'VOID'}
              </span>
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-white/50" />
              <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Match</p>
            </div>
            {selectedTip.match.status === 'FINISHED' && (
              <span className="text-xs text-green-400 font-bold bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">FINISHED</span>
            )}
          </div>
          <p className="text-base font-bold text-white mb-2">{selectedTip.match.league_name}</p>
          <p className="text-2xl font-bold text-white mb-3 leading-tight">
            {selectedTip.match.home_team_name} vs {selectedTip.match.away_team_name}
          </p>
          {selectedTip.match.status === 'FINISHED' && (
            <div className="flex items-center justify-center gap-4 bg-white/5 rounded-lg p-4 mb-3">
              <div className="text-center">
                <p className="text-sm text-white/50 mb-1">{selectedTip.match.home_team_name}</p>
                <span className="text-4xl font-bold text-white">{selectedTip.match.home_score}</span>
              </div>
              <span className="text-2xl text-white/30">-</span>
              <div className="text-center">
                <p className="text-sm text-white/50 mb-1">{selectedTip.match.away_team_name}</p>
                <span className="text-4xl font-bold text-white">{selectedTip.match.away_score}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-white/50 mt-3">
            <Clock size={14} />
            <span className="font-medium">{new Date(selectedTip.match.kickoff_at).toLocaleString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        </div>

        {/* Prediction Section */}
        <div className="space-y-6 mb-6">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-blue-400" />
              <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Your Prediction</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50 mb-1">Market</p>
                <p className="text-xl font-bold text-white">{selectedTip.market_label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/50 mb-1">Selection</p>
                <p className="text-3xl font-bold text-blue-400">{selectedTip.selection_label}</p>
              </div>
            </div>
          </div>

          {/* Confidence Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-white/50" />
                <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Your Confidence</p>
              </div>
              <span className="text-3xl font-bold text-white">{selectedTip.confidence}%</span>
            </div>
            <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-1000 ease-out ${
                  selectedTip.confidence >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  selectedTip.confidence >= 60 ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                  selectedTip.confidence >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
                style={{ width: `${selectedTip.confidence}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/40">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          {/* AI Snapshot */}
          {selectedTip.ai_snapshot && (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-5">
                <Brain className="text-purple-400" size={22} />
                <p className="text-sm font-bold text-white">Bashiri AI Analysis</p>
                {selectedTip.ai_snapshot.ai_agrees && (
                  <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                    <CheckCircle size={12} className="text-green-400" />
                    <span className="text-xs font-bold text-green-400">AI AGREES</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                    <Activity size={12} /> Model Version
                  </p>
                  <p className="text-sm font-bold text-white">{selectedTip.ai_snapshot.model_version}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                    <PieChart size={12} /> AI Probability
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {selectedTip.ai_snapshot.raw_probability !== null 
                      ? `${(selectedTip.ai_snapshot.raw_probability * 100).toFixed(1)}%` 
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                    <BarChart3 size={12} /> Data Quality
                  </p>
                  <p className="text-sm font-bold text-white">
                    {selectedTip.ai_snapshot.data_quality || 'N/A'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                    <Zap size={12} /> AI Agreement
                  </p>
                  <p className={`text-xl font-bold ${selectedTip.ai_snapshot.ai_agrees ? 'text-green-400' : 'text-orange-400'}`}>
                    {selectedTip.ai_snapshot.ai_agrees ? 'YES' : 'NO'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis */}
          {selectedTip.reasoning && (
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-white/50" />
                <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Your Analysis</p>
              </div>
              <p className="text-white/80 leading-relaxed text-sm">{selectedTip.reasoning}</p>
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
            <span>{selectedTip.upvotes_count}</span>
          </PremiumButton>

          <PremiumButton
            onClick={() => handleVote('DOWN')}
            disabled={isVoting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition disabled:opacity-50"
          >
            <MessageCircle size={18} />
            <span>{selectedTip.comments_count}</span>
          </PremiumButton>

          <div className="relative flex-1">
            <PremiumButton
              onClick={() => setShowShareMenu(!showShareMenu)}
              disabled={isSharing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition disabled:opacity-50"
            >
              <Share2 size={18} />
              <span>Share</span>
            </PremiumButton>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute bottom-12 right-0 bg-gray-900 border border-white/10 rounded-lg overflow-hidden z-10">
                {[
                  { name: 'WhatsApp', platform: 'WHATSAPP' },
                  { name: 'Twitter', platform: 'TWITTER' },
                  { name: 'Facebook', platform: 'FACEBOOK' },
                  { name: 'Copy Link', platform: 'COPY' },
                ].map((option) => (
                  <button
                    key={option.platform}
                    onClick={() => handleShare(option.platform)}
                    className="w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition text-left"
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verification Info */}
        {selectedTip.verified_at && (
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-blue-400" size={16} />
              <p className="text-sm font-bold text-white">Verification Result</p>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${status.color}`}>
                {selectedTip.status === 'CORRECT' ? '✅ WON' : 
                 selectedTip.status === 'INCORRECT' ? '❌ LOST' : '⏸️ VOID'}
              </span>
              <span className="text-xs text-white/50">
                {formatDistanceToNow(new Date(selectedTip.verified_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <Eye size={14} />
            <span>{selectedTip.views_count} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>Created {formatDistanceToNow(new Date(selectedTip.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Stats Component */}
      <TipStats tip={selectedTip} />

      {/* Comments */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border border-white/10">
        <TipComments tip={selectedTip} />
      </div>
    </div>
  )
}