/**
 * WebSocket endpoint for real-time timer updates
 * WS /api/v2/timers/ws
 *
 * Clients connect with ?userId=xxx
 * Server sends timer updates every second for running timers
 */


export default defineWebSocketHandler({
  async open(peer) {
    console.log('[WS] Client connected:', peer.id)

    const url = new URL(peer.request?.url || '', 'http://localhost')
    const userId = url.searchParams.get('userId')

    if (!userId) {
      peer.send(JSON.stringify({ type: 'error', message: 'Missing userId' }))
      peer.close()
      return
    }

    // Store userId in peer context
    peer.ctx = { userId }

    // Send initial timer state
    const timers = await getUserTimers(userId)
    peer.send(JSON.stringify({
      type: 'init',
      timers: timers.map(t => ({ ...t, remaining: calculateRemaining(t) }))
    }))

    // Set up interval to send timer updates
    const interval = setInterval(async () => {
      try {
        const timers = await getUserTimers(userId)
        const updates: any[] = []

        for (const timer of timers) {
          if (timer.status === 'running') {
            const remaining = calculateRemaining(timer)

            // Check if timer completed
            if (remaining <= 0 && timer.status === 'running') {
              await updateTimer(userId, timer.id, {
                status: 'completed',
                remaining: 0
              })

              updates.push({
                id: timer.id,
                status: 'completed',
                remaining: 0
              })
            } else {
              updates.push({
                id: timer.id,
                remaining,
                status: timer.status
              })
            }
          }
        }

        if (updates.length > 0) {
          peer.send(JSON.stringify({
            type: 'update',
            timers: updates
          }))
        }
      } catch (error) {
        console.error('[WS] Error in update interval:', error)
      }
    }, 1000) // Update every second

    // Store interval for cleanup
    peer.ctx.interval = interval
  },

  async message(peer, message) {
    const data = JSON.parse(message.text())

    // Handle ping/pong for keepalive
    if (data.type === 'ping') {
      peer.send(JSON.stringify({ type: 'pong' }))
      return
    }

    // Handle timer commands from client
    if (data.type === 'command') {
      const { userId } = peer.ctx
      const { timerId, action, ...updates } = data

      try {
        switch (action) {
          case 'pause':
            await updateTimer(userId, timerId, {
              status: 'paused',
              remaining: calculateRemaining(await getUserTimers(userId).then(timers =>
                timers.find(t => t.id === timerId)!
              ))
            })
            break

          case 'resume':
            await updateTimer(userId, timerId, {
              status: 'running',
              startTime: Date.now()
            })
            break

          case 'complete':
            await updateTimer(userId, timerId, {
              status: 'completed',
              remaining: 0
            })
            break
        }

        peer.send(JSON.stringify({ type: 'ack', timerId }))
      } catch (error: any) {
        peer.send(JSON.stringify({
          type: 'error',
          message: error.message
        }))
      }
    }
  },

  close(peer) {
    console.log('[WS] Client disconnected:', peer.id)

    // Clean up interval
    if (peer.ctx?.interval) {
      clearInterval(peer.ctx.interval)
    }
  },

  error(peer, error) {
    console.error('[WS] Error:', error)
  }
})
