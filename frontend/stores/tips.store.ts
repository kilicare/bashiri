// ============================================
// TIPS STORE - ZUSTAND
// ============================================

'use client'

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import {
  UserTip,
  UserTipList,
  TipPerformance,
  TipFilters,
} from '@/lib/types/tips'

interface TipsState {
  // Data
  tips: UserTipList[]
  selectedTip: UserTip | null
  leaderboard: TipPerformance[]
  userTips: UserTipList[]

  // Filters & Sorting
  filters: TipFilters
  isLoading: boolean
  error: string | null

  // Actions
  setTips: (tips: UserTipList[]) => void
  addTip: (tip: UserTipList) => void
  updateTip: (tipId: number, updates: Partial<UserTipList>) => void
  removeTip: (tipId: number) => void

  setSelectedTip: (tip: UserTip | null) => void
  updateSelectedTip: (updates: Partial<UserTip>) => void

  setLeaderboard: (leaderboard: TipPerformance[]) => void
  setUserTips: (tips: UserTipList[]) => void

  setFilters: (filters: Partial<TipFilters>) => void
  resetFilters: () => void

  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // Computed
  getTipById: (tipId: number) => UserTipList | undefined
  getFilteredTips: () => UserTipList[]
}

const defaultFilters: TipFilters = {
  league: null,
  market: null,
  user: null,
  status: 'PENDING',
  sort: '-created_at',
  page_size: 20,
}

export const useTipsStore = create<TipsState>()(
  devtools(
    persist(
      (set, get) => ({
        // ============================================
        // INITIAL STATE
        // ============================================

        tips: [],
        selectedTip: null,
        leaderboard: [],
        userTips: [],

        filters: defaultFilters,
        isLoading: false,
        error: null,

        // ============================================
        // SETTERS
        // ============================================

        setTips: (tips) => set({ tips }),

        addTip: (tip) =>
          set((state) => ({
            tips: [tip, ...state.tips],
          })),

        updateTip: (tipId, updates) =>
          set((state) => ({
            tips: state.tips.map((tip) =>
              tip.id === tipId ? { ...tip, ...updates } : tip
            ),
          })),

        removeTip: (tipId) =>
          set((state) => ({
            tips: state.tips.filter((tip) => tip.id !== tipId),
          })),

        setSelectedTip: (tip) => set({ selectedTip: tip }),

        updateSelectedTip: (updates) =>
          set((state) => ({
            selectedTip: state.selectedTip
              ? { ...state.selectedTip, ...updates }
              : null,
          })),

        setLeaderboard: (leaderboard) => set({ leaderboard }),
        setUserTips: (tips) => set({ userTips: tips }),

        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
          })),

        resetFilters: () => set({ filters: defaultFilters }),

        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        // ============================================
        // COMPUTED / GETTERS
        // ============================================

        getTipById: (tipId) => {
          const tips = get().tips
          return tips.find((tip) => tip.id === tipId)
        },

        getFilteredTips: () => {
          const { tips, filters } = get()

          let filtered = [...tips]

          // Apply league filter
          if (filters.league) {
            filtered = filtered.filter(
              (tip) => tip.league_name.toLowerCase() === filters.league?.toLowerCase()
            )
          }

          // Apply market filter
          if (filters.market) {
            filtered = filtered.filter(
              (tip) => tip.market_key === filters.market
            )
          }

          // Apply status filter
          if (filters.status) {
            filtered = filtered.filter(
              (tip) => tip.status === filters.status
            )
          }

          return filtered
        },
      }),

      {
        name: 'bashiri-tips-store',
        partialize: (state) => ({
          filters: state.filters,
        }),
      }
    )
  )
)

// ============================================
// SELECTOR HOOKS (OPTIONAL - for optimization)
// ============================================

export const useTipsFilters = () => useTipsStore((state) => state.filters)
export const useTipsLoading = () => useTipsStore((state) => state.isLoading)
export const useTipsError = () => useTipsStore((state) => state.error)
export const useSelectedTip = () => useTipsStore((state) => state.selectedTip)
export const useLeaderboard = () => useTipsStore((state) => state.leaderboard)
export const useTips = () => useTipsStore((state) => state.tips)
