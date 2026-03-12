export type AnalyticsEvent =
  | { type: 'cta_rendered'; body: { variant: string; creation_id: string } }
  | { type: 'cta_activated'; body: { variant: string; creation_id: string } }
  | { type: 'im_session_start'; body: { creation_id: string; total_pages: number; theme_id?: string } }
  | { type: 'im_session_complete'; body: { creation_id: string; duration: number; pages_viewed: number; theme_id?: string } }
  | { type: 'rating_screen_shown'; body: { creation_id: string } }
  | { type: 'rating_submitted'; body: { creation_id: string; rating: number } }
  | { type: 'page_view'; body: { creation_id: string; page_number: number; total_pages: number } }
  | { type: 'timer_start'; body: { creation_id: string; timer_id?: string } }
  | { type: 'timer_complete'; body: { creation_id: string; timer_id?: string } }
  | { type: 'api_call'; body: { version: 'v1' | 'v2' } }
  | { type: 'trial_started'; body: { user_id: string; plan?: string; source?: string } }
  | { type: 'trial_converted'; body: { user_id: string; plan: string } }

export type AnalyticsEventType = AnalyticsEvent['type']

// Extract body type for a given event type
export type EventBody<T extends AnalyticsEventType> = Extract<AnalyticsEvent, { type: T }>['body']

// Stored event row (what comes back from D1)
export interface StoredEvent {
  id: number
  type: AnalyticsEventType
  body: string // JSON string
  domain: string | null
  session_id: string | null
  sample_rate: number
  created_at: number
}

// Daily summary row
export interface DailySummary {
  id: number
  date: string
  domain: string | null
  metric: string
  dimensions: string | null // JSON
  value: number
  sample_rate: number
  created_at: number
}

// Counter row
export interface Counter {
  id: number
  key: string
  value: number
  updated_at: number
}
