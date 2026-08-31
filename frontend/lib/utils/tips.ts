// ============================================
// TIPS UTILITIES
// ============================================

import { getMarketRegistry } from '@/lib/api/tips'

// Cache for market registry to avoid repeated API calls
let marketRegistryCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getMarketRegistryCached() {
  const now = Date.now()
  if (!marketRegistryCache || now - cacheTimestamp > CACHE_DURATION) {
    try {
      const response = await getMarketRegistry()
      marketRegistryCache = response
      cacheTimestamp = now
    } catch (error) {
      console.error('Failed to fetch market registry:', error)
      // Return empty cache on error
      marketRegistryCache = { markets: [] }
    }
  }
  return marketRegistryCache
}

export async function getMarketLabel(marketKey: string): Promise<string> {
  const registry = await getMarketRegistryCached()
  const market = registry.markets.find((m: any) => m.key === marketKey)
  return market?.label || marketKey
}

export async function getSelectionLabel(marketKey: string, selectionKey: string): Promise<string> {
  const registry = await getMarketRegistryCached()
  const market = registry.markets.find((m: any) => m.key === marketKey)
  const selection = market?.selections.find((s: any) => s.key === selectionKey)
  return selection?.label || selectionKey
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'PENDING': 'bg-yellow-500/20 text-yellow-400',
    'CORRECT': 'bg-green-500/20 text-green-400',
    'INCORRECT': 'bg-red-500/20 text-red-400',
    'VOID': 'bg-gray-500/20 text-gray-400',
  }
  return colors[status] || ''
}

export function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    'PENDING': '⏳',
    'CORRECT': '✅',
    'INCORRECT': '❌',
    'VOID': '⏸️',
  }
  return icons[status] || '❓'
}
