// ============================================
// CUSTOM HOOKS FOR TIPS
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useTipsStore } from '@/stores/tips.store'
import {
  getTips,
  getTip,
  createTip,
  updateTip,
  deleteTip,
  voteTip,
  getTipComments,
  addTipComment,
  getTipLeaderboard,
  getUserTips,
  shareTip,
  handleTipError,
  TipError,
} from '@/lib/api/tips'
import { CreateTipRequest, UpdateTipRequest, TipFilters } from '@/lib/types/tips'

// ============================================
// useFetchTips - Fetch tips with filtering
// ============================================

export function useFetchTips(filters?: TipFilters) {
  const { setTips, setLoading, setError } = useTipsStore()
  const [isInitialized, setIsInitialized] = useState(false)

  const fetchTips = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTips(filters)
      setTips(data.results)
      setIsInitialized(true)
    } catch (error) {
      const errorMessage = handleTipError(error)
      setError(errorMessage)
      console.error('Error fetching tips:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, setTips, setLoading, setError])

  useEffect(() => {
    if (!isInitialized) {
      fetchTips()
    }
  }, [fetchTips, isInitialized])

  return { fetchTips }
}

// ============================================
// useFetchTip - Fetch single tip
// ============================================

export function useFetchTip(tipId: number) {
  const { setSelectedTip, setLoading, setError } = useTipsStore()

  useEffect(() => {
    if (!tipId) return

    const fetchTip = async () => {
      try {
        setLoading(true)
        setError(null)
        const tip = await getTip(tipId)
        setSelectedTip(tip)
      } catch (error) {
        const errorMessage = handleTipError(error)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchTip()
  }, [tipId, setSelectedTip, setLoading, setError])
}

// ============================================
// useCreateTip - Create new tip
// ============================================

export function useCreateTip() {
  const { user: currentUser } = useAuthStore()
  const { addTip } = useTipsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createNewTip = useCallback(
    async (data: CreateTipRequest) => {
      if (!currentUser) {
        setError('You must be logged in to create tips')
        return null
      }

      try {
        setIsLoading(true)
        setError(null)
        console.log('[useCreateTip] Creating tip with data:', JSON.stringify(data, null, 2))
        const newTip = await createTip(data)
        
        // Add to store
        addTip({
          id: newTip.id,
          user: newTip.user,
          home_team: newTip.match.home_team_name,
          away_team: newTip.match.away_team_name,
          league_name: newTip.match.league_name,
          kickoff_at: newTip.match.kickoff_at,
          market_key: newTip.market_key,
          market_label: newTip.market_label,
          selection: newTip.selection,
          selection_label: newTip.selection_label,
          confidence: newTip.confidence,
          status: newTip.status,
          views_count: 0,
          upvotes_count: 0,
          downvotes_count: 0,
          comments_count: 0,
          is_locked: newTip.is_locked,
          ai_agrees: newTip.ai_snapshot?.ai_agrees || null,
          created_at: newTip.created_at,
        })

        return newTip
      } catch (error) {
        const errorMessage = handleTipError(error)
        setError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser, addTip]
  )

  return { createNewTip, isLoading, error }
}

// ============================================
// useUpdateTip - Update tip
// ============================================

export function useUpdateTip(tipId: number) {
  const { updateTip: updateStored, updateSelectedTip } = useTipsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTipData = useCallback(
    async (data: UpdateTipRequest) => {
      try {
        setIsLoading(true)
        setError(null)
        const updated = await updateTip(tipId, data)
        updateStored(tipId, {
          market_key: updated.market_key,
          selection: updated.selection,
          confidence: updated.confidence,
        })
        updateSelectedTip({
          market_key: updated.market_key,
          selection: updated.selection,
          confidence: updated.confidence,
          reasoning: updated.reasoning,
        })
        return updated
      } catch (error) {
        const errorMessage = handleTipError(error)
        setError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [tipId, updateStored, updateSelectedTip]
  )

  return { updateTipData, isLoading, error }
}

// ============================================
// useDeleteTip - Delete tip
// ============================================

export function useDeleteTip(tipId: number) {
  const { removeTip } = useTipsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTipData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await deleteTip(tipId)
      removeTip(tipId)
      return true
    } catch (error) {
      const errorMessage = handleTipError(error)
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [tipId, removeTip])

  return { deleteTipData, isLoading, error }
}

// ============================================
// useVoteTip - Vote on tip
// ============================================

export function useVoteTip(tipId: number) {
  const { updateSelectedTip } = useTipsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vote = useCallback(
    async (voteType: 'UP' | 'DOWN') => {
      try {
        setIsLoading(true)
        setError(null)
        const updated = await voteTip(tipId, voteType)
        updateSelectedTip({
          upvotes_count: updated.upvotes_count,
          downvotes_count: updated.downvotes_count,
          user_vote: voteType,
        })
        return updated
      } catch (error) {
        const errorMessage = handleTipError(error)
        setError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [tipId, updateSelectedTip]
  )

  return { vote, isLoading, error }
}

// ============================================
// useFetchLeaderboard - Fetch rankings
// ============================================

export function useFetchLeaderboard() {
  const { setLeaderboard, setLoading, setError } = useTipsStore()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getTipLeaderboard()
        setLeaderboard(data.results)
      } catch (error) {
        const errorMessage = handleTipError(error)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [setLeaderboard, setLoading, setError])
}

// ============================================
// useFetchUserTips - Fetch user's tips
// ============================================

export function useFetchUserTips(username: string, filters?: TipFilters) {
  const { setUserTips, setLoading, setError } = useTipsStore()

  useEffect(() => {
    const fetchUserTips = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getUserTips(username, filters)
        setUserTips(data.results)
      } catch (error) {
        const errorMessage = handleTipError(error)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchUserTips()
    }
  }, [username, filters, setUserTips, setLoading, setError])
}

// ============================================
// useShareTip - Share tip
// ============================================

export function useShareTip(tipId: number) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const share = useCallback(
    async (platform: 'WHATSAPP' | 'TWITTER' | 'FACEBOOK' | 'COPY' | 'SMS') => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await shareTip(tipId, platform)
        return result
      } catch (error) {
        const errorMessage = handleTipError(error)
        setError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [tipId]
  )

  return { share, isLoading, error }
}
