/**
 * Client-side analytics tracker for Interactive Mode
 * Tracks user interactions and sends batched events to server
 */

import { ref, onBeforeUnmount } from 'vue'
import type { CtaVariant } from '../components/InteractiveMode/types'

export interface AnalyticsEvent {
  type: 'im_session_start' | 'im_session_complete' | 'timer_start' | 'timer_stop' | 'timer_complete' | 'rating_screen_shown' | 'rating_submitted' | 'page_view' | 'cta_activated' | 'cta_rendered'
  timestamp: number
  metadata?: Record<string, any>
}

export interface AnalyticsConfig {
  domain: string
  creationId: string
  baseUrl?: string
  isDemo?: boolean
}

export interface SessionData {
  userId: string
  sessionId: string
  domain: string
  creationId: string
  startTime: number
  endTime: number
  events: AnalyticsEvent[]
  isDemo?: boolean
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
  let sessionStartedAt: number | null = null
  let sessionEnded = false

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
  }

  /**
   * Track session start — call once when user enters interactive mode
   */
  function trackSessionStart(total: number) {
    if (sessionStartedAt !== null) return // already started
    sessionStartedAt = Date.now()
    totalPages.value = total
    trackEvent('im_session_start', {
      creationId: config.creationId,
      totalPages: total
    })
  }

  /**
   * Track session end — call when modal closes or page unloads.
   * Wall-clock duration from start to now.
   */
  function trackSessionEnd() {
    if (sessionStartedAt === null || sessionEnded) return
    sessionEnded = true
    const duration = Math.round((Date.now() - sessionStartedAt) / 1000)
    trackEvent('im_session_complete', {
      creationId: config.creationId,
      duration,
      pagesViewed: pagesViewed.value.size,
      totalPages: totalPages.value
    })
    // Send immediately — this is the end of the session
    sendBatch()
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
   * Track CTA render (which variant was shown to the user)
   */
  function trackCtaRendered(variant: CtaVariant) {
    trackEvent('cta_rendered', { variant })
    // Flush immediately so the render is captured even if the visitor bounces
    // before the 15s auto-send tick.
    sendBatch()
  }

  /**
   * Track CTA activation (which variant was used to enter interactive mode)
   */
  function trackCtaActivated(variant: CtaVariant) {
    trackEvent('cta_activated', { variant })
  }

  /**
   * Send batched events to server
   */
  async function sendBatch() {
    if (events.value.length === 0) {
      return
    }

    const sessionData: SessionData = {
      userId,
      sessionId,
      domain: config.domain,
      creationId: config.creationId,
      startTime,
      endTime: Date.now(),
      events: events.value,
      isDemo: config.isDemo || false
    }

    try {
      // text/plain keeps this a CORS-safe "simple request" so browsers skip
      // the OPTIONS preflight. keepalive lets it complete on page unload.
      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(sessionData),
        credentials: 'omit',
        keepalive: true
      })

      // Clear events after successful send
      events.value = []
    } catch (error) {
      console.error('[Analytics] Failed to send analytics:', error)
    }
  }

  /**
   * Send batch on page unload — also ends session if still active
   */
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      trackSessionEnd()
    })

    // Periodic auto-send every 15 seconds (for CTA/page_view events)
    const intervalId = setInterval(() => {
      sendBatch()
    }, 15000) // 15 seconds

    // Clean up interval on unmount
    onBeforeUnmount(() => {
      clearInterval(intervalId)
    })
  }

  // End session and send remaining events on unmount
  onBeforeUnmount(() => {
    trackSessionEnd()
  })

  return {
    trackEvent,
    trackSessionStart,
    trackSessionEnd,
    trackPageView,
    trackTimerEvent,
    trackRatingEvent,
    trackCtaRendered,
    trackCtaActivated,
    sendBatch,
    userId,
    sessionId
  }
}
