'use client'

import { useEffect } from 'react'
import { useWebSocket } from './useWebSocket'
import { useTipsStore } from '@/stores/tips.store'

export function useTipsRealtime(tipId?: number) {
  const { isConnected, subscribe, send } = useWebSocket('/ws/tips/')
  const { updateSelectedTip, setLeaderboard } = useTipsStore()

  // Subscribe to tip verification updates
  useEffect(() => {
    if (!isConnected || !tipId) return

    send({
      type: 'subscribe_tip',
      action: 'subscribe_tip',
      tip_id: tipId,
    })

    const unsubscribeTipVerified = subscribe('tip_verified', (message) => {
      if (message.tip_id === tipId) {
        updateSelectedTip({
          status: message.status,
        })
      }
    })

    const unsubscribeTipVoted = subscribe('tip_voted', (message) => {
      if (message.tip_id === tipId) {
        updateSelectedTip({
          upvotes_count: message.upvotes,
          downvotes_count: message.downvotes,
        })
      }
    })

    return () => {
      unsubscribeTipVerified()
      unsubscribeTipVoted()
      send({
        type: 'unsubscribe_tip',
        action: 'unsubscribe_tip',
        tip_id: tipId,
      })
    }
  }, [isConnected, tipId, send, subscribe, updateSelectedTip])

  // Subscribe to leaderboard updates
  useEffect(() => {
    if (!isConnected) return

    send({
      type: 'subscribe_leaderboard',
      action: 'subscribe_leaderboard',
    })

    const unsubscribe = subscribe('leaderboard_updated', (message) => {
      setLeaderboard(message.data)
    })

    return unsubscribe
  }, [isConnected, send, subscribe, setLeaderboard])

  return { isConnected }
}
