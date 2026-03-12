/**
 * Analytics D1 database utility
 *
 * The analytics database is a separate D1 binding (DB_ANALYTICS) not managed
 * by NuxtHub — so we access it directly via the Cloudflare env bindings
 * and wrap it with Drizzle.
 */

import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'

/**
 * Get a Drizzle instance for the analytics D1 database.
 * Must be called from within an event handler with access to the H3 event.
 */
export function useAnalyticsDB(event: H3Event): DrizzleD1Database {
  const d1 = (event.context.cloudflare?.env as Record<string, any>)?.DB_ANALYTICS
  if (!d1) {
    throw new Error('[Analytics] DB_ANALYTICS binding not available')
  }
  return drizzle(d1)
}
