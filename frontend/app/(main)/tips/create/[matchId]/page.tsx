'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useCreateTip } from '@/hooks/useTips'
import { TipForm } from '@/components/tips/TipForm'
import { CreateTipRequest, TipMatch } from '@/lib/types/tips'
import { useState, useEffect } from 'react'
import { ArrowLeft, Loader } from 'lucide-react'
import Link from 'next/link'
import { getMatchDashboard } from '@/lib/api/predictions'

interface AIRecommendation {
  market_key: string
  selection: string
  selection_label?: string
  confidence: number
  probability: number
  status: string
  data_quality?: string
  model_version?: string
  home_win_probability?: number | null
  draw_probability?: number | null
  away_win_probability?: number | null
  btts_yes_probability?: number | null
  over_2_5_probability?: number | null
}

export default function CreateTipPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = parseInt(params.matchId as string)
  
  const { user } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [matchData, setMatchData] = useState<TipMatch | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null)
  const [isLoadingMatch, setIsLoadingMatch] = useState(true)
  const [matchError, setMatchError] = useState<string | null>(null)
  const { createNewTip, isLoading, error: createError } = useCreateTip()

  // Fetch match data from predictions API
  useEffect(() => {
    async function fetchMatchData() {
      try {
        setIsLoadingMatch(true)
        const dashboard = await getMatchDashboard(matchId)
        
        // Convert predictions Match to TipMatch format
        const tipMatch: TipMatch = {
          id: dashboard.match.id,
          home_team_name: dashboard.match.home_team.name,
          away_team_name: dashboard.match.away_team.name,
          league_name: dashboard.match.league.name,
          league_code: dashboard.match.league.code,
          kickoff_at: dashboard.match.kickoff_at,
          status: dashboard.match.status,
          home_score: dashboard.match.home_score,
          away_score: dashboard.match.away_score,
        }
        
        setMatchData(tipMatch)
        
        // Extract AI recommendation from dashboard
        if (dashboard.top_pick && dashboard.top_pick.status === 'STRONG') {
          // Find the market with the AI pick
          const aiMarket = dashboard.markets.find(m => m.key === dashboard.top_pick.market_label)
          if (aiMarket && aiMarket.ai_pick) {
            const aiOption = aiMarket.options.find(o => o.key === aiMarket.ai_pick)
            const homeWinProb = dashboard.markets.find(m => m.key === '1X2')?.options.find(o => o.key === 'home_win')?.prob
            const drawProb = dashboard.markets.find(m => m.key === '1X2')?.options.find(o => o.key === 'draw')?.prob
            const awayWinProb = dashboard.markets.find(m => m.key === '1X2')?.options.find(o => o.key === 'away_win')?.prob
            const bttsProb = dashboard.markets.find(m => m.key === 'BTTS')?.options.find(o => o.key === 'btts_yes')?.prob
            const overProb = dashboard.markets.find(m => m.key === 'OVER_UNDER_2_5')?.options.find(o => o.key === 'over')?.prob
            
            setAiRecommendation({
              market_key: aiMarket.key,
              selection: aiMarket.ai_pick,
              selection_label: aiOption?.label,
              confidence: dashboard.top_pick.confidence,
              probability: aiOption?.prob || 0,
              status: dashboard.top_pick.status,
              data_quality: dashboard.top_pick.data_quality,
              model_version: dashboard.top_pick.model_version,
              // Extract probabilities from markets (filter out null)
              home_win_probability: homeWinProb !== null && homeWinProb !== undefined ? homeWinProb : undefined,
              draw_probability: drawProb !== null && drawProb !== undefined ? drawProb : undefined,
              away_win_probability: awayWinProb !== null && awayWinProb !== undefined ? awayWinProb : undefined,
              btts_yes_probability: bttsProb !== null && bttsProb !== undefined ? bttsProb : undefined,
              over_2_5_probability: overProb !== null && overProb !== undefined ? overProb : undefined,
            })
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch match data:', err)
        setMatchError('Failed to load match information. Please try again.')
      } finally {
        setIsLoadingMatch(false)
      }
    }
    
    fetchMatchData()
  }, [matchId])

  if (!user) {
    return (
      <div className="min-h-dvh px-5 pt-safe pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 mb-4">Please sign in to create tips</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (isLoadingMatch) {
    return (
      <div className="min-h-dvh px-5 pt-safe pb-24 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading match information...</p>
        </div>
      </div>
    )
  }

  if (matchError || !matchData) {
    return (
      <div className="min-h-dvh px-5 pt-safe pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 mb-4">{matchError || 'Match not found'}</p>
          <Link
            href="/tips"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
          >
            Back to Tips
          </Link>
        </div>
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
          match={matchData}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          aiRecommendation={aiRecommendation}
          isLocked={matchData.status !== 'SCHEDULED'}
        />
      </div>
    </div>
  )
}
