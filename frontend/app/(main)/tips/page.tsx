'use client'

import { useEffect } from 'react'
import { useTipsStore } from '@/stores/tips.store'
import { useFetchTips } from '@/hooks/useTips'
import { TipCard } from '@/components/tips/TipCard'
import { TipFilter } from '@/components/tips/TipFilter'
import { useRouter } from 'next/navigation'
import { Loader, ArrowLeft, Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export default function TipsPage() {
  const router = useRouter()
  const { tips, filters, isLoading, error } = useTipsStore()
  const { fetchTips } = useFetchTips(filters)
  const { user } = useAuthStore()

  useEffect(() => {
    fetchTips()
  }, [filters])

  return (
    <div className="min-h-dvh px-5 pt-safe pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tips Marketplace</h1>
            <p className="text-white/50">Discover predictions from top tipsters</p>
          </div>
        </div>

        {/* Create Tip Button */}
        {user && (
          <button
            onClick={() => router.push('/matches')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create Tip</span>
          </button>
        )}
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
        <div className="flex flex-col items-center justify-center py-12">
          <Loader size={40} className="text-blue-500 animate-spin mb-4" />
          <p className="text-white/50">Loading tips...</p>
        </div>
      )}

      {/* Tips Grid */}
      {!isLoading && tips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              onClick={() => router.push(`/tips/${tip.id}`)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tips.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50 mb-4">No tips found</p>
          <button
            onClick={() => useTipsStore.getState().resetFilters()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
