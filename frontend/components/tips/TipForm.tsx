'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { TipMatch, CreateTipRequest } from '@/lib/types/tips'
import { PremiumButton } from '@/components/ui/Button'

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
}

const MARKET_OPTIONS = [
  { key: '1X2', label: 'Win/Draw/Loss', selections: [
    { key: 'home_win', label: 'Home Win' },
    { key: 'draw', label: 'Draw' },
    { key: 'away_win', label: 'Away Win' },
  ]},
  { key: 'OVER_UNDER_2_5', label: 'Over/Under 2.5 Goals', selections: [
    { key: 'over_2.5', label: 'Over 2.5' },
    { key: 'under_2.5', label: 'Under 2.5' },
  ]},
  { key: 'BTTS', label: 'Both Teams Score', selections: [
    { key: 'both_teams_score_yes', label: 'Both Score' },
    { key: 'both_teams_score_no', label: 'One Team Doesn\'t Score' },
  ]},
  { key: 'DRAW_NO_BET', label: 'Draw No Bet', selections: [
    { key: 'home_win', label: 'Home' },
    { key: 'away_win', label: 'Away' },
  ]},
]

export function TipForm({ match, onSubmit, isLoading }: TipFormProps) {
  const [selectedMarket, setSelectedMarket] = useState('1X2')
  
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
  const selectedMarketObj = MARKET_OPTIONS.find((m) => m.key === selectedMarket)

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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Match Info */}
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-xs text-white/50 mb-1">Match</p>
        <p className="text-lg font-bold text-white">
          {match.home_team_name} vs {match.away_team_name}
        </p>
        <p className="text-xs text-white/50 mt-1">{match.league_name}</p>
      </div>

      {/* Market Selection */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          Market *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {MARKET_OPTIONS.map((market) => (
            <button
              key={market.key}
              type="button"
              onClick={() => {
                setSelectedMarket(market.key)
                setValue('market_key', market.key)
                // Reset selection to first option of new market
                setValue('selection', market.selections[0].key)
              }}
              className={`p-3 rounded-lg text-sm font-bold transition ${
                selectedMarket === market.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
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
              className={`p-3 rounded-lg text-sm font-bold transition ${
                selection === sel.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {sel.label}
            </button>
          ))}
        </div>
        {errors.selection && (
          <p className="text-xs text-red-400 mt-1">{errors.selection.message}</p>
        )}
      </div>

      {/* Confidence Slider */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          Confidence: {confidence}%
        </label>
        <input
          type="range"
          {...register('confidence', { valueAsNumber: true })}
          min="0"
          max="100"
          step="5"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-white/50 mt-1">
          <span>Unsure</span>
          <span>Very Confident</span>
        </div>
      </div>

      {/* Reasoning */}
      <div>
        <label className="block text-sm font-bold text-white mb-2">
          Analysis (Optional)
        </label>
        <textarea
          {...register('reasoning')}
          placeholder="Share your analysis or reasoning..."
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/30 text-sm resize-none focus:border-blue-500 focus:outline-none"
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
                className="w-4 h-4"
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
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
      >
        {isLoading ? 'Creating Tip...' : 'Post Tip'}
      </PremiumButton>
    </form>
  )
}
