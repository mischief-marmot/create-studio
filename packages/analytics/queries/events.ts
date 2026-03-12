import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { events } from '../schema'
import type { AnalyticsEventType } from '../types'

interface InsertEvent {
  type: AnalyticsEventType
  body: string
  domain?: string | null
  session_id?: string | null
  sample_rate: number
  created_at: number
}

/**
 * Batch insert events into the events table.
 */
export async function insertEvents(db: DrizzleD1Database, rows: InsertEvent[]) {
  if (rows.length === 0) return

  await db.insert(events).values(rows)
}

interface QueryEventsOptions {
  type?: AnalyticsEventType
  domain?: string
  startDate?: number
  endDate?: number
  limit?: number
}

/**
 * Query raw events with optional filters.
 */
export async function queryEvents(db: DrizzleD1Database, options: QueryEventsOptions = {}) {
  const conditions = []

  if (options.type) {
    conditions.push(eq(events.type, options.type))
  }
  if (options.domain) {
    conditions.push(eq(events.domain, options.domain))
  }
  if (options.startDate) {
    conditions.push(gte(events.created_at, options.startDate))
  }
  if (options.endDate) {
    conditions.push(lte(events.created_at, options.endDate))
  }

  const query = db
    .select()
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(events.created_at))

  if (options.limit) {
    return query.limit(options.limit)
  }

  return query
}

/**
 * Delete events older than a given timestamp.
 */
export async function purgeEventsBefore(db: DrizzleD1Database, timestamp: number) {
  return db.delete(events).where(lte(events.created_at, timestamp))
}
