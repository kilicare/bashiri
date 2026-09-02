'use client'

import { useEffect, useState } from 'react'
import { useTipsStore } from '@/stores/tips.store'
import { useFetchTips } from '@/hooks/useTips'
import { TipCard } from '@/components/tips/TipCard'
import { TipFilter } from '@/components/tips/TipFilter'
import { useRouter } from 'next/navigation'
import { Loader, ArrowLeft, Plus, TrendingUp, Flame, Brain, Users, Target, Zap, Clock, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export default function TipsPage() {
  const router = useRouter()
  const { tips, filters, isLoading, error } = useTipsStore()
  const { fetchTips } = useFetchTips(filters)
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'trending' | 'ai_aligned' | 'hot_form' | 'pending'>('all')

  useEffect(() => {
    fetchTips()
  }, [filters, activeTab])

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    const newFilters = { ...filters }
    
    switch (tab) {
      case 'following':
        // Following tab: show tips from users you follow
        newFilters.following = true
        newFilters.user = undefined
        newFilters.status = undefined
        break
      case 'trending':
        newFilters.sort = 'engagement'
        newFilters.following = undefined
        newFilters.status = undefined
        break
      case 'ai_aligned':
        newFilters.sort = 'ai_agrees'
        newFilters.following = undefined
        newFilters.status = undefined
        break
      case 'hot_form':
        newFilters.sort = 'recent_form'
        newFilters.following = undefined
        newFilters.status = undefined
        break
      case 'pending':
        newFilters.status = 'PENDING'
        newFilters.following = undefined
        newFilters.sort = undefined
        break
      default:
        newFilters.sort = undefined
        newFilters.user = undefined
        newFilters.following = undefined
        newFilters.status = undefined
    }
    
    useTipsStore.getState().setFilters(newFilters)
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'all': return null
      case 'following': return Users
      case 'trending': return TrendingUp
      case 'ai_aligned': return Brain
      case 'hot_form': return Flame
      case 'pending': return Clock
      default: return null
    }
  }

  return (
    <div className="min-h-dvh px-5 pt-safe pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft size={22} className="text-white" />
          </button>
          <div>
            <h1 className="text-[28px] font-bold text-white mb-2">Tips Marketplace</h1>
            <p className="text-[15px] text-white/50">Discover predictions from verified tipsters</p>
          </div>
        </div>

        {/* Create Tip Button */}
        {user && (
          <button
            onClick={() => router.push('/matches')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-bold transition"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create Tip</span>
          </button>
        )}
      </div>

      {/* Discovery Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Tips', icon: null, gradient: 'from-blue-500 to-purple-600' },
          { key: 'following', label: 'Following', icon: Users, gradient: 'from-green-500 to-emerald-600' },
          { key: 'trending', label: 'Trending', icon: TrendingUp, gradient: 'from-orange-500 to-red-600' },
          { key: 'ai_aligned', label: 'AI Aligned', icon: Brain, gradient: 'from-purple-500 to-pink-600' },
          { key: 'hot_form', label: 'Hot Form', icon: Flame, gradient: 'from-yellow-500 to-orange-600' },
          { key: 'pending', label: 'Pending', icon: Clock, gradient: 'from-cyan-500 to-blue-600' },
        ].map((tab) => {
          const TabIcon = getTabIcon(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[15px] font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-${tab.gradient.split('-')[1]}-500/20`
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:scale-105'
              }`}
            >
              {TabIcon && <TabIcon size={14} />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <TipFilter />

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <Loader size={48} className="text-blue-500 animate-spin" />
            <Sparkles size={24} className="text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-white/50 mt-4">Loading tips...</p>
        </div>
      )}

      {/* Tips Grid */}
      {!isLoading && tips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-white/50 mb-4">
            <span className="flex items-center gap-2">
              <Target size={14} />
              <span>{tips.length} tips found</span>
            </span>
            {activeTab !== 'all' && (
              <button
                onClick={() => handleTabChange('all')}
                className="text-blue-400 hover:text-blue-300 transition"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tips.map((tip) => (
              <TipCard
                key={tip.id}
                tip={tip}
                onClick={() => router.push(`/tips/${tip.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tips.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Target size={48} className="text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No tips found</h3>
          <p className="text-sm text-white/50 mb-6">
            {activeTab === 'following' 
              ? "You're not following any tipsters yet"
              : activeTab === 'pending'
              ? "No pending tips available"
              : "Try adjusting your filters or check back later"
            }
          </p>
          <button
            onClick={() => {
              useTipsStore.getState().resetFilters()
              handleTabChange('all')
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}