/**
 * Client-side analytics tracker for Interactive Mode
 * Tracks user interactions and sends batched events to server
 */

import { ref, onBeforeUnmount } from 'vue'

export interface AnalyticsEvent {
  type: 'timer_start' | 'timer_stop' | 'timer_complete' | 'rating_screen_shown' | 'rating_submitted' | 'page_view'
  timestamp: number
  metadata?: Record<string, any>
}

export interface AnalyticsConfig {
  domain: string
  creationId: string
  baseUrl?: string
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

const STORAGE_KEY = 'create-studio-analytics-id'

/**
 * Generate or retrieve persistent user ID from localStorage
 */
function getUserId(): string {
  if (typeof window === 'undefined') return ''

  let userId = localStorage.getItem(STORAGE_KEY)

  if (!userId) {
    // Generate UUID v4
    userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    localStorage.setItem(STORAGE_KEY, userId)
  }

  return userId
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Analytics composable for tracking user interactions
 */
export function useAnalytics(config: AnalyticsConfig) {
  const userId = getUserId()
  const sessionId = generateSessionId()
  const startTime = Date.now()
  const events = ref<AnalyticsEvent[]>([])
  const pagesViewed = ref(new Set<number>())
  const totalPages = ref(0)
  const sessionStartTime = ref(Date.now())
  const totalActiveTime = ref(0)
  const lastActivityTime = ref(Date.now())
  const isActive = ref(true)

  const analyticsEndpoint = config.baseUrl ? `${config.baseUrl}/api/analytics/events` : 'https://create.studio/api/analytics/events'

  /**
   * Track an event
   */
  function trackEvent(type: AnalyticsEvent['type'], metadata?: Record<string, any>) {
    events.value.push({
      type,
      timestamp: Date.now(),
      metadata
    })

    // Update last activity time
    lastActivityTime.value = Date.now()
  }

  /**
   * Track page view
   */
  function trackPageView(pageNumber: number, total: number) {
    pagesViewed.value.add(pageNumber)
    totalPages.value = total

    trackEvent('page_view', {
      pageNumber,
      totalPages: total
    })
  }

  /**
   * Track timer event
   */
  function trackTimerEvent(action: 'start' | 'stop' | 'complete', timerId?: string) {
    const eventType = `timer_${action}` as AnalyticsEvent['type']
    trackEvent(eventType, { timerId })
  }

  /**
   * Track rating event
   */
  function trackRatingEvent(action: 'screen_shown' | 'submitted', rating?: number) {
    const eventType = `rating_${action}` as AnalyticsEvent['type']
    trackEvent(eventType, rating !== undefined ? { rating } : undefined)
  }

  /**
   * Calculate total active time
   * Only counts time when user is actively interacting (not idle)
   */
  function calculateActiveTime(): number {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityTime.value

    // If less than 30 seconds since last activity, count it as active time
    if (timeSinceLastActivity < 30000) {
      totalActiveTime.value += now - sessionStartTime.value
      sessionStartTime.value = now
    }

    return Math.round(totalActiveTime.value / 1000) // Convert to seconds
  }

  /**
   * Send batched events to server
   */
  async function sendBatch() {
    if (events.value.length === 0) {
      return
    }

    let sessionData: SessionData

    try {
      const activeTime = calculateActiveTime()

      sessionData = {
        userId,
        sessionId,
        domain: config.domain,
        creationId: config.creationId,
        startTime,
        endTime: Date.now(),
        totalDuration: activeTime,
        pagesViewed: pagesViewed.value.size,
        totalPages: totalPages.value,
        events: events.value
      }
    } catch (error) {
      console.error('[Analytics] Error building session data:', error)
      return
    }

    try {
      // Use sendBeacon if available (better for page unload)
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(sessionData)], {
          type: 'application/json'
        })
        navigator.sendBeacon(analyticsEndpoint, blob)
      } else {
        // Fallback to fetch
        await fetch(analyticsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sessionData),
          keepalive: true
        })
      }

      // Clear events after successful send
      events.value = []
    } catch (error) {
      console.error('[Analytics] Failed to send analytics:', error)
    }
  }

  /**
   * Track visibility changes to pause/resume timing
   */
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isActive.value = false
        calculateActiveTime()
      } else {
        isActive.value = true
        sessionStartTime.value = Date.now()
      }
    })
  }

  /**
   * Send batch on page unload
   */
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      sendBatch()
    })

    // Periodic auto-send every 15 seconds
    const intervalId = setInterval(() => {
      sendBatch()
    }, 15000) // 15 seconds

    // Clean up interval on unmount
    onBeforeUnmount(() => {
      clearInterval(intervalId)
    })
  }

  // Also set up automatic cleanup
  onBeforeUnmount(() => {
    sendBatch()
  })

  return {
    trackEvent,
    trackPageView,
    trackTimerEvent,
    trackRatingEvent,
    sendBatch,
    userId,
    sessionId
  }
}
