/**
 * Analytics types and helpers shared with main app's KV analytics store
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
