'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { TipMatch, CreateTipRequest, MarketDefinition } from '@/lib/types/tips'
import { PremiumButton } from '@/components/ui/Button'
import { Brain, TrendingUp, Lock, AlertTriangle, Loader } from 'lucide-react'
import { getMarketRegistry } from '@/lib/api/tips'

const tipFormSchema = z.object({
  market_key: z.string().min(1, 'Market is required'),
  selection: z.string().min(1, 'Selection is required'),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().max(500, 'Max 500 characters').optional(),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']),
})

type TipFormData = z.infer<typeof tipFormSchema>

interface TipFormProps {
  match: TipMatch
  onSubmit: (data: CreateTipRequest) => Promise<void>
  isLoading?: boolean
  aiRecommendation?: {
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
  } | null
  isLocked?: boolean
}

export function TipForm({ match, onSubmit, isLoading, aiRecommendation, isLocked = false }: TipFormProps) {
  const [selectedMarket, setSelectedMarket] = useState('1X2')
  const [marketOptions, setMarketOptions] = useState<MarketDefinition[]>([])
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true)
  
  // Load market registry from API
  useEffect(() => {
    async function loadMarkets() {
      try {
        const response = await getMarketRegistry()
        setMarketOptions(response.markets)
        
        // Set default market to first available market
        if (response.markets.length > 0) {
          setSelectedMarket(response.markets[0].key)
          setValue('market_key', response.markets[0].key)
          setValue('selection', response.markets[0].selections[0].key)
        }
      } catch (error) {
        console.error('Failed to load market registry:', error)
        // Fallback to hardcoded markets if API fails
        setMarketOptions([])
      } finally {
        setIsLoadingMarkets(false)
      }
    }
    
    loadMarkets()
  }, [])
  
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TipFormData>({
    resolver: zodResolver(tipFormSchema),
    defaultValues: {
      market_key: '1X2',
      selection: 'home_win',
      confidence: 50,
      reasoning: '',
      visibility: 'PUBLIC',
    } as TipFormData,
  })

  const confidence = watch('confidence')
  const marketKey = watch('market_key')
  const selection = watch('selection')
  const selectedMarketObj = marketOptions.find((m) => m.key === selectedMarket)

  // Check if current selection matches AI recommendation
  const matchesAI = aiRecommendation && 
    aiRecommendation.market_key === marketKey && 
    aiRecommendation.selection === selection

  // Sync selection when market changes
  useEffect(() => {
    if (selectedMarketObj && !selectedMarketObj.selections.find(s => s.key === selection)) {
      setValue('selection', selectedMarketObj.selections[0].key)
    }
  }, [selectedMarket, selectedMarketObj, selection, setValue])

  const handleFormSubmit = async (data: TipFormData) => {
    await onSubmit({
      match: match.id,
      ...data,
    })
  }

  if (isLocked) {
    return (
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="text-yellow-400" size={24} />
          <div>
            <p className="text-lg font-bold text-white">Match Locked</p>
            <p className="text-sm text-white/50">Tips cannot be created after match starts</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingMarkets) {
    return (
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <div className="flex items-center justify-center gap-3">
          <Loader className="text-blue-400 animate-spin" size={24} />
          <p className="text-sm text-white/50">Loading market options...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Match Info with Enhanced Intelligence */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 mb-1">Match</p>
            <p className="text-lg font-bold text-white">
              {match.home_team_name} vs {match.away_team_name}
            </p>
            <p className="text-xs text-white/50 mt-1">{match.league_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 mb-1">Kickoff</p>
            <p className="text-sm font-bold text-white">
              {new Date(match.kickoff_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* BASHIRI AI Intelligence */}
        {aiRecommendation && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="text-purple-400" size={20} />
              <p className="text-sm font-bold text-white">BASHIRI AI Match Intelligence</p>
            </div>
            
            {/* Match Result Probabilities */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Home Win</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${aiRecommendation.home_win_probability || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-12 text-right">
                    {aiRecommendation.home_win_probability ? `${aiRecommendation.home_win_probability.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Draw</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gray-500 h-full" 
                      style={{ width: `${aiRecommendation.draw_probability || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-12 text-right">
                    {aiRecommendation.draw_probability ? `${aiRecommendation.draw_probability.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Away Win</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ width: `${aiRecommendation.away_win_probability || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-12 text-right">
                    {aiRecommendation.away_win_probability ? `${aiRecommendation.away_win_probability.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Markets */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {aiRecommendation.btts_yes_probability !== null && aiRecommendation.btts_yes_probability !== undefined && (
                <div className="bg-white/5 rounded p-2">
                  <p className="text-white/50 mb-1">BTTS Yes</p>
                  <p className="font-bold text-white">{aiRecommendation.btts_yes_probability.toFixed(1)}%</p>
                </div>
              )}
              {aiRecommendation.over_2_5_probability !== null && aiRecommendation.over_2_5_probability !== undefined && (
                <div className="bg-white/5 rounded p-2">
                  <p className="text-white/50 mb-1">Over 2.5</p>
                  <p className="font-bold text-white">{aiRecommendation.over_2_5_probability.toFixed(1)}%</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendation Context */}
      {aiRecommendation && aiRecommendation.status === 'STRONG' && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="text-blue-400" size={20} />
            <p className="text-sm font-bold text-white">Bashiri AI Strong Pick</p>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-white/50">Recommended Pick</p>
              <p className="text-sm font-bold text-white">
                {aiRecommendation.selection_label || aiRecommendation.selection} 
                <span className="text-white/50 ml-2">• {aiRecommendation.market_key}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/50">AI Confidence</p>
              <p className="text-sm font-bold text-blue-400">{aiRecommendation.confidence.toFixed(1)}%</p>
            </div>
          </div>
          {aiRecommendation.probability && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50">Model Probability</p>
              <p className="text-sm font-bold text-white">{(aiRecommendation.probability * 100).toFixed(1)}%</p>
            </div>
          )}
          <p className="text-xs text-white/30 mt-2">
            This is a high-confidence AI recommendation based on historical data and model analysis.
          </p>
        </div>
      )}

      {/* Market Selection */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          Market *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {marketOptions.map((market) => (
            <button
              key={market.key}
              type="button"
              onClick={() => {
                setSelectedMarket(market.key)
                setValue('market_key', market.key)
                // Reset selection to first option of new market
                setValue('selection', market.selections[0].key)
              }}
              disabled={isLocked}
              className={`p-3 rounded-lg text-sm font-bold transition ${
                selectedMarket === market.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {market.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selection */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          Selection *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {selectedMarketObj?.selections.map((sel) => (
            <button
              key={sel.key}
              type="button"
              onClick={() => setValue('selection', sel.key)}
              disabled={isLocked}
              className={`p-3 rounded-lg text-sm font-bold transition relative ${
                selection === sel.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sel.label}
              {aiRecommendation && aiRecommendation.selection === sel.key && aiRecommendation.market_key === selectedMarket && (
                <Brain className="absolute top-1 right-1 text-green-400" size={14} />
              )}
            </button>
          ))}
        </div>
        {errors.selection && (
          <p className="text-xs text-red-400 mt-1">{errors.selection.message}</p>
        )}
      </div>

      {/* Confidence Slider - User Confidence vs AI Probability */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          <div className="flex items-center justify-between">
            <span>Your Confidence: {confidence}%</span>
            {aiRecommendation && aiRecommendation.probability && (
              <span className="text-xs text-white/50">
                AI Probability: {(aiRecommendation.probability * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </label>
        <input
          type="range"
          {...register('confidence', { valueAsNumber: true })}
          min="0"
          max="100"
          step="5"
          disabled={isLocked}
          className="w-full disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-white/50 mt-1">
          <span>Unsure</span>
          <span>Very Confident</span>
        </div>
        <p className="text-xs text-white/30 mt-2">
          Note: Your confidence reflects your personal belief, not the AI model's probability
        </p>
      </div>

      {/* AI Agreement Indicator */}
      {aiRecommendation && aiRecommendation.status === 'STRONG' && (
        <div className={`p-4 rounded-lg border ${
          matchesAI 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {matchesAI ? (
              <Brain className="text-green-400" size={18} />
            ) : (
              <AlertTriangle className="text-orange-400" size={18} />
            )}
            <p className="text-sm font-bold text-white">
              {matchesAI ? '🧠 AI ALIGNED' : '⚡ CONTRARIAN PICK'}
            </p>
          </div>
          <p className="text-xs text-white/50">
            {matchesAI 
              ? 'Your selection matches the Bashiri AI recommendation. The model has identified this as a strong pick.'
              : 'Your selection differs from the Bashiri AI recommendation. This may represent a contrarian opportunity or higher risk.'}
          </p>
        </div>
      )}

      {/* Reasoning */}
      <div>
        <label className="block text-sm font-bold text-white mb-2">
          Analysis (Optional)
        </label>
        <textarea
          {...register('reasoning')}
          placeholder="Share your analysis or reasoning..."
          disabled={isLocked}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/30 text-sm resize-none focus:border-blue-500 focus:outline-none disabled:opacity-50"
          rows={3}
        />
        {errors.reasoning && (
          <p className="text-xs text-red-400 mt-1">{errors.reasoning.message}</p>
        )}
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          Visibility
        </label>
        <div className="space-y-2">
          {(['PUBLIC', 'FOLLOWERS', 'PRIVATE'] as const).map((visibility) => (
            <label key={visibility} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                {...register('visibility')}
                value={visibility}
                disabled={isLocked}
                className="w-4 h-4 disabled:opacity-50"
              />
              <span className="text-sm text-white">
                {visibility === 'PUBLIC' && 'Everyone can see'}
                {visibility === 'FOLLOWERS' && 'Only followers can see'}
                {visibility === 'PRIVATE' && 'Only me can see'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <PremiumButton
        type="submit"
        disabled={isLoading || isLocked}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
      >
        {isLoading ? 'Creating Tip...' : 'Post Tip'}
      </PremiumButton>
    </form>
  )
}