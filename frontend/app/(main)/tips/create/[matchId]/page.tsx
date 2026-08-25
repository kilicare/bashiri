'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useCreateTip } from '@/hooks/useTips'
import { TipForm } from '@/components/tips/TipForm'
import { CreateTipRequest } from '@/lib/types/tips'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateTipPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = parseInt(params.matchId as string)
  
  const { user } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const { createNewTip, isLoading, error: createError } = useCreateTip()

  // Mock match data - in real app, fetch from predictions API
  const mockMatch = {
    id: matchId,
    home_team_name: 'Manchester United',
    away_team_name: 'Liverpool',
    league_name: 'Premier League',
    league_code: 'EPL',
    kickoff_at: new Date().toISOString(),
    status: 'SCHEDULED' as const,
    home_score: null,
    away_score: null,
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 mb-4">Please sign in to create tips</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
        >
          Sign In
        </button>
      </div>
    )
  }

  const handleSubmit = async (data: CreateTipRequest) => {
    setError(null)
    const result = await createNewTip(data)
    if (result) {
      router.push(`/tips/${result.id}`)
    } else {
      setError(createError)
    }
  }

  return (
    <div className="min-h-dvh px-5 pt-safe pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/tips"
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Tip</h1>
          <p className="text-white/50">Share your prediction with the community</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border border-white/10">
        <TipForm
          match={mockMatch}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
