/**
 * Composable for syncing timers with server via WebSocket
 * Works in any context (in-DOM or iframe)
 */

import { ref, onUnmounted } from 'vue'

interface ServerTimer {
  id: string
  remaining: number
  status: 'running' | 'paused' | 'completed'
}

export const useServerTimerSync = (userId: string, baseUrl: string) => {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  let reconnectTimeout: NodeJS.Timeout | null = null

  // Callbacks
  const onTimerUpdate = ref<((timers: ServerTimer[]) => void) | null>(null)
  const onTimerComplete = ref<((timerId: string) => void) | null>(null)

  const connect = () => {
    if (ws.value?.readyState === WebSocket.OPEN) return

    try {
      // Convert http(s) to ws(s)
      const wsUrl = baseUrl.replace(/^http/, 'ws') + `/api/v2/timers/ws?userId=${userId}`

      console.log('[ServerSync] Connecting to:', wsUrl)
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('[ServerSync] Connected')
        connected.value = true
        reconnectAttempts.value = 0
      }

      ws.value.onmessage = (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'init':
            console.log('[ServerSync] Received initial timers:', data.timers)
            if (onTimerUpdate.value) {
              onTimerUpdate.value(data.timers)
            }
            break

          case 'update':
            if (onTimerUpdate.value) {
              onTimerUpdate.value(data.timers)
            }

            // Check for completed timers
            data.timers.forEach((timer: ServerTimer) => {
              if (timer.status === 'completed' && onTimerComplete.value) {
                onTimerComplete.value(timer.id)
              }
            })
            break

          case 'error':
            console.error('[ServerSync] Server error:', data.message)
            break

          case 'pong':
            // Keepalive response
            break
        }
      }

      ws.value.onerror = (error) => {
        console.error('[ServerSync] WebSocket error:', error)
      }

      ws.value.onclose = () => {
        console.log('[ServerSync] Disconnected')
        connected.value = false

        // Attempt reconnect with exponential backoff
        if (reconnectAttempts.value < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
          console.log(`[ServerSync] Reconnecting in ${delay}ms...`)

          reconnectTimeout = setTimeout(() => {
            reconnectAttempts.value++
            connect()
          }, delay)
        } else {
          console.error('[ServerSync] Max reconnect attempts reached')
        }
      }

      // Send keepalive ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (ws.value?.readyState === WebSocket.OPEN) {
          ws.value.send(JSON.stringify({ type: 'ping' }))
        } else {
          clearInterval(pingInterval)
        }
      }, 30000)
    } catch (error) {
      console.error('[ServerSync] Failed to connect:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
    }

    if (ws.value) {
      ws.value.close()
      ws.value = null
    }

    connected.value = false
  }

  const sendCommand = (timerId: string, action: string, updates?: any) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'command',
        timerId,
        action,
        ...updates
      }))
    } else {
      console.warn('[ServerSync] Cannot send command, not connected')
    }
  }

  // Start timer on server
  const startTimer = async (timer: any) => {
    try {
      const response = await fetch(`${baseUrl}/api/v2/timers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          timerId: timer.id,
          creationId: timer.creationId || 'unknown',
          duration: timer.duration,
          label: timer.label,
          remaining: timer.remaining,
          status: 'running',
          stepIndex: timer.stepIndex
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start timer on server')
      }

      return await response.json()
    } catch (error) {
      console.error('[ServerSync] Failed to start timer:', error)
      throw error
    }
  }

  // Pause timer on server
  const pauseTimer = async (timerId: string, remaining: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/v2/timers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          timerId,
          creationId: 'unknown', // We don't have this info when pausing
          remaining,
          status: 'paused'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to pause timer on server')
      }

      return await response.json()
    } catch (error) {
      console.error('[ServerSync] Failed to pause timer:', error)
      throw error
    }
  }

  // Delete timer from server
  const deleteTimer = async (timerId: string) => {
    try {
      await fetch(`${baseUrl}/api/v2/timers/${userId}/${timerId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('[ServerSync] Failed to delete timer:', error)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connect,
    disconnect,
    sendCommand,
    startTimer,
    pauseTimer,
    deleteTimer,
    onTimerUpdate,
    onTimerComplete
  }
}
