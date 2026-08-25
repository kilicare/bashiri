'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

type MessageHandler = (message: WebSocketMessage) => void

export function useWebSocket(url: string) {
  const { user } = useAuthStore()
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messageHandlers = useRef<Map<string, MessageHandler[]>>(new Map())

  // Connect to WebSocket
  useEffect(() => {
    if (!user) return

    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}${url}`

    try {
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
      }

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          const handlers = messageHandlers.current.get(message.type) || []
          handlers.forEach((handler) => handler(message))
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onerror = (event) => {
        console.warn('WebSocket connection failed - real-time features disabled')
        setError(null) // Don't show error to user, just disable features
        setIsConnected(false)
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
      }

      return () => {
        if (ws.current) {
          ws.current.close()
        }
      }
    } catch (error) {
      console.warn('Failed to create WebSocket - real-time features disabled')
      setError(null) // Don't show error to user
    }
  }, [user, url])

  // Subscribe to message type
  const subscribe = useCallback((messageType: string, handler: MessageHandler) => {
    if (!messageHandlers.current.has(messageType)) {
      messageHandlers.current.set(messageType, [])
    }
    messageHandlers.current.get(messageType)!.push(handler)

    // Cleanup
    return () => {
      const handlers = messageHandlers.current.get(messageType) || []
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }, [])

  // Send message
  const send = useCallback((message: WebSocketMessage) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected')
    }
  }, [isConnected])

  return {
    isConnected,
    error,
    subscribe,
    send,
  }
}
