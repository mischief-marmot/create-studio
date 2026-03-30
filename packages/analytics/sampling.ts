import type { AnalyticsEventType } from './types'

export const SAMPLING_RATES: Record<AnalyticsEventType, number> = {
  cta_rendered: 1.0,
  cta_activated: 1.0,
  im_session_start: 1.0,
  im_session_complete: 1.0,
  rating_screen_shown: 1.0,
  rating_submitted: 1.0,
  page_view: 1.0,
  timer_start: 1.0,
  timer_complete: 1.0,
  api_call: 0.05,
  trial_started: 1.0,
  trial_converted: 1.0,
}

// Events that should also increment real-time counters
export const COUNTER_EVENTS: AnalyticsEventType[] = [
  'cta_rendered',
  'cta_activated',
  'im_session_start',
  'im_session_complete',
  'rating_screen_shown',
  'rating_submitted',
  'trial_started',
  'trial_converted',
]

export function shouldSample(eventType: AnalyticsEventType): boolean {
  const rate = SAMPLING_RATES[eventType]
  if (rate >= 1.0) return true
  if (rate <= 0) return false
  return Math.random() < rate
}

export function getSampleRate(eventType: AnalyticsEventType): number {
  return SAMPLING_RATES[eventType]
}
