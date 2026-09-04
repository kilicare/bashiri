// ============================================
// TIPS API CLIENT
// ============================================

import { apiClient } from './client'
import {
  UserTip,
  UserTipList,
  TipPerformance,
  TipComment,
  CreateTipRequest,
  UpdateTipRequest,
  TipFilters,
  TipsListResponse,
  LeaderboardResponse,
  CommentsResponse,
  MarketDefinition,
  MarketRegistryResponse,
  TipStar,
} from '@/lib/types/tips'

const BASE_URL = '/tips'

// ============================================
// TIPS CRUD OPERATIONS
// ============================================

/**
 * GET /tips/
 * List all public tips with filtering and sorting
 */
export async function getTips(filters?: TipFilters) {
  const params = new URLSearchParams()

  if (filters?.league) params.append('league', filters.league)
  if (filters?.market) params.append('market', filters.market)
  if (filters?.user) params.append('user', filters.user)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.sort) params.append('sort', filters.sort)
  if (filters?.page_size) params.append('page_size', filters.page_size.toString())

  const query = params.toString()
  const url = query ? `${BASE_URL}/?${query}` : BASE_URL

  return apiClient<TipsListResponse>(url, { skipAuth: true })
}

/**
 * GET /tips/?match={matchId}
 * Get tips for a specific match
 */
export async function getTipsByMatch(matchId: number) {
  return apiClient<TipsListResponse>(`${BASE_URL}/?match=${matchId}`, { skipAuth: true })
}

/**
 * POST /tips/
 * Create a new tip (authenticated)
 */
export async function createTip(data: CreateTipRequest) {
  console.log('[CreateTip] Sending data:', JSON.stringify(data, null, 2))
  return apiClient<UserTip>(`${BASE_URL}/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * GET /tips/{id}/
 * Get specific tip details
 */
export async function getTip(tipId: number) {
  return apiClient<UserTip>(`${BASE_URL}/${tipId}/`, { skipAuth: true })
}

/**
 * PUT /tips/{id}/
 * Update tip (before match starts)
 */
export async function updateTip(tipId: number, data: UpdateTipRequest) {
  return apiClient<UserTip>(`${BASE_URL}/${tipId}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE /tips/{id}/
 * Delete tip
 */
export async function deleteTip(tipId: number) {
  return apiClient<void>(`${BASE_URL}/${tipId}/`, {
    method: 'DELETE',
  })
}

// ============================================
// VOTING & ENGAGEMENT
// ============================================

/**
 * POST /tips/{id}/vote/
 * Vote on tip (upvote or downvote)
 */
export async function voteTip(tipId: number, vote: 'UP' | 'DOWN') {
  return apiClient<UserTip>(`${BASE_URL}/${tipId}/vote/`, {
    method: 'POST',
    body: JSON.stringify({ vote }),
  })
}

/**
 * POST /tips/{id}/share/
 * Track tip share
 */
export async function shareTip(
  tipId: number,
  platform: 'WHATSAPP' | 'TWITTER' | 'FACEBOOK' | 'COPY' | 'SMS'
) {
  return apiClient<{ message: string; shared_to: string }>(
    `${BASE_URL}/${tipId}/share/`,
    {
      method: 'POST',
      body: JSON.stringify({ shared_to: platform }),
    }
  )
}

// ============================================
// COMMENTS
// ============================================

/**
 * GET /tips/{id}/comments/
 * Get tip comments
 */
export async function getTipComments(tipId: number) {
  return apiClient<CommentsResponse>(`${BASE_URL}/${tipId}/comments/`, {
    skipAuth: true,
  })
}

/**
 * POST /tips/{id}/comments/
 * Add comment to tip
 */
export async function addTipComment(tipId: number, content: string, parentId?: number) {
  const body: { content: string; parent?: number } = { content }
  if (parentId) body.parent = parentId

  return apiClient<TipComment>(`${BASE_URL}/${tipId}/comments/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ============================================
// MARKET REGISTRY
// ============================================

/**
 * GET /tips/markets/
 * Get available market definitions from centralized registry
 */
export async function getMarketRegistry(category?: string) {
  const params = category ? `?category=${category}` : ''
  return apiClient<MarketRegistryResponse>(`${BASE_URL}/markets/${params}`, { skipAuth: true })
}

// ============================================
// RANKINGS & LEADERBOARD
// ============================================

/**
 * GET /tips/leaderboard/
 * Get tipster rankings
 */
export async function getTipLeaderboard(params?: URLSearchParams) {
  const query = params?.toString() || ''
  const url = query ? `${BASE_URL}/leaderboard/?${query}` : `${BASE_URL}/leaderboard/`
  return apiClient<LeaderboardResponse>(url, {
    skipAuth: true,
  })
}

export async function getTipStars(params?: URLSearchParams) {
  const query = params?.toString() || ''
  const url = query ? `${BASE_URL}/tip-stars/?${query}` : `${BASE_URL}/tip-stars/`
  return apiClient<{ count: number; next: number | null; previous: number | null; results: TipStar[] }>(url, { skipAuth: true })
}

/**
 * GET /tips/user/{username}/
 * Get tips for specific user
 */
export async function getUserTips(username: string, filters?: TipFilters) {
  const params = new URLSearchParams()

  if (filters?.sort) params.append('sort', filters.sort)
  if (filters?.page_size) params.append('page_size', filters.page_size.toString())

  const query = params.toString()
  const url = query ? `${BASE_URL}/user/${username}/?${query}` : `${BASE_URL}/user/${username}/`

  return apiClient<TipsListResponse>(url, { skipAuth: true })
}

/**
 * GET /tips/best-streak-user/
 * Get user with best streak for today
 */
export async function getBestStreakUser() {
  return apiClient<any>(`${BASE_URL}/best-streak-user/`, { skipAuth: true })
}

// ============================================
// ERROR HANDLING
// ============================================

export class TipError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message)
    this.name = 'TipError'
  }
}

/**
 * Handle API errors gracefully
 */
export function handleTipError(error: any): string {
  if (error instanceof TipError) {
    switch (error.statusCode) {
      case 400:
        // Try to extract more detailed error from the error message
        if (error.message && typeof error.message === 'object') {
          return JSON.stringify(error.message)
        }
        return 'Invalid tip data. Please check your input.'
      case 401:
        return 'You must be logged in to create tips.'
      case 403:
        return 'You are not authorized to perform this action.'
      case 404:
        return 'Tip not found.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      default:
        return error.message
    }
  }
  // If error has a message property, return it
  if (error?.message) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}
