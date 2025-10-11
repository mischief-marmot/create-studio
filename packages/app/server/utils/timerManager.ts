/**
 * Server-side timer manager using Cloudflare KV for state persistence
 * Timers are stored with a 7-day TTL for automatic cleanup
 */

interface Timer {
  id: string
  userId: string // Anonymous ID from client
  creationId: string
  duration: number
  label: string
  startTime: number
  remaining: number
  status: 'running' | 'paused' | 'completed'
  stepIndex?: number
}

const TIMER_TTL = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 * Store timer state in KV with TTL
 */
export async function storeTimer(timer: Timer) {
  const key = `timer:${timer.userId}:${timer.id}`

  await hubKV().set(key, JSON.stringify(timer), {
    ttl: TIMER_TTL
  })

  return timer
}

/**
 * Get timer state from KV
 */
export async function getTimer(userId: string, timerId: string): Promise<Timer | null> {
  const key = `timer:${userId}:${timerId}`
  const data = await hubKV().get(key)

  if (!data) return null

  // In dev mode, data might already be an object; in production it's a string
  return typeof data === 'string' ? JSON.parse(data) : data
}

/**
 * Get all timers for a user
 */
export async function getUserTimers(userId: string): Promise<Timer[]> {
  const prefix = `timer:${userId}:`
  const keys = await hubKV().keys(prefix)

  const timers: Timer[] = []

  for (const key of keys) {
    const data = await hubKV().get(key)
    if (data) {
      // In dev mode, data might already be an object; in production it's a string
      const timer = typeof data === 'string' ? JSON.parse(data) : data
      timers.push(timer)
    }
  }

  return timers
}

/**
 * Update timer state
 */
export async function updateTimer(userId: string, timerId: string, updates: Partial<Timer>) {
  const timer = await getTimer(userId, timerId)

  if (!timer) {
    throw new Error('Timer not found')
  }

  const updatedTimer = { ...timer, ...updates }
  await storeTimer(updatedTimer)

  return updatedTimer
}

/**
 * Delete timer
 */
export async function deleteTimer(userId: string, timerId: string) {
  const key = `timer:${userId}:${timerId}`
  await hubKV().del(key)
}

/**
 * Calculate current remaining time for a running timer
 */
export function calculateRemaining(timer: Timer): number {
  if (timer.status !== 'running') {
    return timer.remaining
  }

  const elapsed = Date.now() - timer.startTime
  const remaining = Math.max(0, timer.remaining - Math.floor(elapsed / 1000))

  return remaining
}
