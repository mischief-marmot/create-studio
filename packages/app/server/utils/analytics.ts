/**
 * Analytics utilities for tracking usage with Cloudflare KV
 */

export interface AnalyticsEvent {
  type: 'timer_start' | 'timer_stop' | 'timer_complete' | 'rating_screen_shown' | 'rating_submitted' | 'page_view'
  timestamp: number
  metadata?: Record<string, any>
}

export interface SessionData {
  userId: string
  sessionId: string
  domain: string
  creationId: string
  startTime: number
  endTime: number
  totalDuration: number
  pagesViewed: number
  totalPages: number
  events: AnalyticsEvent[]
}

export interface DailyAggregate {
  sessions: number
  uniqueUsers: Set<string>
  totalDuration: number
  avgDuration: number
  pagesViewed: number
  totalPages: number
  events: {
    timer_start: number
    timer_stop: number
    timer_complete: number
    rating_screen_shown: number
    rating_submitted: number
  }
}

export interface ApiCounter {
  count: number
  errors?: number
  lastUpdated: number
}

/**
 * Generate analytics KV key
 */
export function getAnalyticsKey(parts: string[]): string {
  return `analytics:${parts.join(':')}`
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get current month in YYYY-MM format
 */
export function getMonthString(date: Date = new Date()): string {
  return date.toISOString().substring(0, 7)
}

/**
 * Increment a counter in KV (atomic operation)
 */
export async function incrementCounter(key: string, amount: number = 1): Promise<void> {
  const kv = hubKV()

  const current = await kv.get<ApiCounter>(key)
  const newValue: ApiCounter = {
    count: (current?.count || 0) + amount,
    errors: current?.errors || 0,
    lastUpdated: Date.now()
  }

  await kv.set(key, newValue, {
    // 1 year TTL for counters
    ttl: 365 * 24 * 60 * 60
  })
}

/**
 * Increment error counter
 */
export async function incrementErrorCounter(key: string): Promise<void> {
  const kv = hubKV()

  const current = await kv.get<ApiCounter>(key)
  const newValue: ApiCounter = {
    count: current?.count || 0,
    errors: (current?.errors || 0) + 1,
    lastUpdated: Date.now()
  }

  await kv.set(key, newValue, {
    ttl: 365 * 24 * 60 * 60
  })
}

/**
 * Get counter value
 */
export async function getCounter(key: string): Promise<number> {
  const kv = hubKV()
  const data = await kv.get<ApiCounter>(key)
  return data?.count || 0
}

/**
 * Store session data
 */
export async function storeSession(sessionData: SessionData): Promise<void> {
  const kv = hubKV()
  const key = getAnalyticsKey(['session', sessionData.userId, sessionData.sessionId])

  await kv.set(key, sessionData, {
    // 30 days TTL for session data
    ttl: 30 * 24 * 60 * 60
  })
}

/**
 * Update daily aggregate for a site/creation
 */
export async function updateDailyAggregate(sessionData: SessionData): Promise<void> {
  const kv = hubKV()
  const date = getDateString(new Date(sessionData.endTime))
  const key = getAnalyticsKey(['site', sessionData.domain, sessionData.creationId, date])

  // Get existing aggregate
  const existing = await kv.get<any>(key) || {
    sessions: 0,
    uniqueUsers: [],
    totalDuration: 0,
    avgDuration: 0,
    pagesViewed: 0,
    totalPages: 0,
    events: {
      timer_start: 0,
      timer_stop: 0,
      timer_complete: 0,
      rating_screen_shown: 0,
      rating_submitted: 0
    }
  }

  // Count events by type
  const eventCounts: Record<string, number> = {}
  sessionData.events.forEach(event => {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1
  })

  // Add user to unique users set
  const uniqueUsers = new Set(existing.uniqueUsers || [])
  uniqueUsers.add(sessionData.userId)

  // Calculate new aggregate
  const newSessions = existing.sessions + 1
  const newTotalDuration = existing.totalDuration + sessionData.totalDuration

  const updated = {
    sessions: newSessions,
    uniqueUsers: Array.from(uniqueUsers),
    totalDuration: newTotalDuration,
    avgDuration: Math.round(newTotalDuration / newSessions),
    pagesViewed: existing.pagesViewed + sessionData.pagesViewed,
    totalPages: existing.totalPages + sessionData.totalPages,
    events: {
      timer_start: existing.events.timer_start + (eventCounts.timer_start || 0),
      timer_stop: existing.events.timer_stop + (eventCounts.timer_stop || 0),
      timer_complete: existing.events.timer_complete + (eventCounts.timer_complete || 0),
      rating_screen_shown: existing.events.rating_screen_shown + (eventCounts.rating_screen_shown || 0),
      rating_submitted: existing.events.rating_submitted + (eventCounts.rating_submitted || 0)
    }
  }

  await kv.set(key, updated, {
    // 1 year TTL for daily aggregates
    ttl: 365 * 24 * 60 * 60
  })
}

/**
 * Update global daily summary
 */
export async function updateGlobalSummary(sessionData: SessionData): Promise<void> {
  const kv = hubKV()
  const date = getDateString(new Date(sessionData.endTime))
  const key = getAnalyticsKey(['summary', 'global', date])

  const existing = await kv.get<any>(key) || {
    sessions: 0,
    uniqueUsers: [],
    totalDuration: 0,
    avgDuration: 0,
    sites: new Set()
  }

  const uniqueUsers = new Set(existing.uniqueUsers || [])
  uniqueUsers.add(sessionData.userId)

  const sites = new Set(existing.sites || [])
  sites.add(sessionData.domain)

  const newSessions = existing.sessions + 1
  const newTotalDuration = existing.totalDuration + sessionData.totalDuration

  const updated = {
    sessions: newSessions,
    uniqueUsers: Array.from(uniqueUsers),
    totalDuration: newTotalDuration,
    avgDuration: Math.round(newTotalDuration / newSessions),
    sites: Array.from(sites)
  }

  await kv.set(key, updated, {
    ttl: 365 * 24 * 60 * 60
  })
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(shown: number, submitted: number): number {
  if (shown === 0) return 0
  return Math.round((submitted / shown) * 10000) / 100 // 2 decimal places
}

/**
 * Get date range of keys (for dashboard queries)
 */
export async function getDateRangeData(prefix: string, startDate: string, endDate: string): Promise<Map<string, any>> {
  const kv = hubKV()
  const results = new Map()

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Iterate through each day in range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = getDateString(d)
    const key = `${prefix}${dateStr}`
    const value = await kv.get(key)

    if (value) {
      results.set(dateStr, value)
    }
  }

  return results
}
