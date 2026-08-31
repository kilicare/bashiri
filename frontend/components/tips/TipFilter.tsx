'use client'

import { useTipsStore } from '@/stores/tips.store'
import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

const MARKETS = [
  // Full Match Markets
  { key: '1X2', label: '1X2 (Win/Draw/Loss)' },
  { key: 'DOUBLE_CHANCE', label: 'Double Chance' },
  { key: 'DRAW_NO_BET', label: 'Draw No Bet' },
  { key: 'BTTS', label: 'BTTS (Both Teams Score)' },
  { key: 'OVER_UNDER_1_5', label: 'Over/Under 1.5 Goals' },
  { key: 'OVER_UNDER_2_5', label: 'Over/Under 2.5 Goals' },
  // Home Team Goals
  { key: 'HOME_GOALS_OVER_0_5', label: 'Home Over/Under 0.5' },
  { key: 'HOME_GOALS_OVER_1_5', label: 'Home Over/Under 1.5' },
  { key: 'HOME_GOALS_OVER_2_5', label: 'Home Over/Under 2.5' },
  // Away Team Goals
  { key: 'AWAY_GOALS_OVER_0_5', label: 'Away Over/Under 0.5' },
  { key: 'AWAY_GOALS_OVER_1_5', label: 'Away Over/Under 1.5' },
  { key: 'AWAY_GOALS_OVER_2_5', label: 'Away Over/Under 2.5' },
  // Correct Score
  { key: 'CORRECT_SCORE', label: 'Correct Score' },
]

const LEAGUES = [
  { code: 'EPL', name: 'Premier League' },
  { code: 'LA_LIGA', name: 'La Liga' },
  { code: 'BUNDESLIGA', name: 'Bundesliga' },
  { code: 'SERIE_A', name: 'Serie A' },
  { code: 'LIGUE_1', name: 'Ligue 1' },
  { code: 'CHAMPIONSHIP', name: 'Championship' },
]

const SORTS = [
  { key: '-created_at', label: 'Newest' },
  { key: '-views_count', label: 'Most Viewed' },
  { key: '-upvotes_count', label: 'Most Upvoted' },
  { key: '-confidence', label: 'Highest Confidence' },
]

export function TipFilter() {
  const { filters, setFilters, resetFilters } = useTipsStore()
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters =
    filters.league || filters.market || filters.user

  return (
    <div className="space-y-3 mb-6">
      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition"
      >
        <span className="text-sm font-bold text-white">
          Filters {hasActiveFilters && `(${Object.values(filters).filter(Boolean).length})`}
        </span>
        <ChevronDown
          size={18}
          className={`text-white/50 transition ${showFilters ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
          {/* League Filter */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-2 uppercase">
              League
            </label>
            <select
              value={filters.league || ''}
              onChange={(e) => setFilters({ league: e.target.value || null })}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
            >
              <option value="">All Leagues</option>
              {LEAGUES.map((league) => (
                <option key={league.code} value={league.code}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          {/* Market Filter */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-2 uppercase">
              Market
            </label>
            <select
              value={filters.market || ''}
              onChange={(e) => setFilters({ market: e.target.value || null })}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
            >
              <option value="">All Markets</option>
              {MARKETS.map((market) => (
                <option key={market.key} value={market.key}>
                  {market.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-2 uppercase">
              Sort
            </label>
            <select
              value={filters.sort || '-created_at'}
              onChange={(e) => setFilters({ sort: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
            >
              {SORTS.map((sort) => (
                <option key={sort.key} value={sort.key}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded text-sm font-bold text-white transition"
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
