import { eq, and, gte, lte, sql, count, inArray } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { events } from '../schema'

interface AggregatedSummary {
  date: string
  domain: string | null
  metric: string
  dimensions: string | null
  value: number
  sample_rate: number
}

// ---------------------------------------------------------------------------
// CTA metrics: count cta_rendered / cta_activated per variant per domain
// ---------------------------------------------------------------------------
export async function aggregateCtaMetrics(
  db: DrizzleD1Database,
  date: string,
  startTs: number,
  endTs: number,
): Promise<AggregatedSummary[]> {
  const rows = await db
    .select({
      type: events.type,
      domain: events.domain,
      sample_rate: events.sample_rate,
      variant: sql<string>`json_extract(${events.body}, '$.variant')`.as('variant'),
      count: count(),
    })
    .from(events)
    .where(
      and(
        inArray(events.type, ['cta_rendered', 'cta_activated']),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.type, events.domain, events.sample_rate, sql`json_extract(${events.body}, '$.variant')`)

  return rows.map((row) => ({
    date,
    domain: row.domain,
    metric: `${row.type}_count`,
    dimensions: row.variant ? JSON.stringify({ variant: row.variant }) : null,
    value: row.count,
    sample_rate: row.sample_rate,
  }))
}

// ---------------------------------------------------------------------------
// IM session metrics: count starts/completes, average duration per domain
// ---------------------------------------------------------------------------
export async function aggregateImSessionMetrics(
  db: DrizzleD1Database,
  date: string,
  startTs: number,
  endTs: number,
): Promise<AggregatedSummary[]> {
  const summaries: AggregatedSummary[] = []

  // Count DISTINCT sessions for im_session_start and im_session_complete.
  // The client may send multiple batches per session, each synthesizing
  // im_session_start/complete — so we deduplicate by session_id.
  const countRows = await db
    .select({
      type: events.type,
      domain: events.domain,
      sample_rate: events.sample_rate,
      count: sql<number>`COUNT(DISTINCT ${events.session_id})`.as('count'),
    })
    .from(events)
    .where(
      and(
        inArray(events.type, ['im_session_start', 'im_session_complete']),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.type, events.domain, events.sample_rate)

  for (const row of countRows) {
    summaries.push({
      date,
      domain: row.domain,
      metric: `${row.type}_count`,
      dimensions: null,
      value: row.count,
      sample_rate: row.sample_rate,
    })
  }

  // Average duration from im_session_complete events
  const durationRows = await db
    .select({
      domain: events.domain,
      sample_rate: events.sample_rate,
      avg_duration: sql<number>`AVG(json_extract(${events.body}, '$.duration'))`.as('avg_duration'),
      count: count(),
    })
    .from(events)
    .where(
      and(
        eq(events.type, 'im_session_complete'),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.domain, events.sample_rate)

  for (const row of durationRows) {
    if (row.avg_duration !== null) {
      summaries.push({
        date,
        domain: row.domain,
        metric: 'im_session_avg_duration',
        dimensions: null,
        value: row.avg_duration,
        sample_rate: row.sample_rate,
      })
    }
  }

  return summaries
}

// ---------------------------------------------------------------------------
// Rating metrics: count shown/submitted, average rating per domain
// ---------------------------------------------------------------------------
export async function aggregateRatingMetrics(
  db: DrizzleD1Database,
  date: string,
  startTs: number,
  endTs: number,
): Promise<AggregatedSummary[]> {
  const summaries: AggregatedSummary[] = []

  // Count rating_screen_shown and rating_submitted
  const countRows = await db
    .select({
      type: events.type,
      domain: events.domain,
      sample_rate: events.sample_rate,
      count: count(),
    })
    .from(events)
    .where(
      and(
        inArray(events.type, ['rating_screen_shown', 'rating_submitted']),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.type, events.domain, events.sample_rate)

  for (const row of countRows) {
    summaries.push({
      date,
      domain: row.domain,
      metric: `${row.type}_count`,
      dimensions: null,
      value: row.count,
      sample_rate: row.sample_rate,
    })
  }

  // Average rating from rating_submitted
  const avgRows = await db
    .select({
      domain: events.domain,
      sample_rate: events.sample_rate,
      avg_rating: sql<number>`AVG(json_extract(${events.body}, '$.rating'))`.as('avg_rating'),
    })
    .from(events)
    .where(
      and(
        eq(events.type, 'rating_submitted'),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.domain, events.sample_rate)

  for (const row of avgRows) {
    if (row.avg_rating !== null) {
      summaries.push({
        date,
        domain: row.domain,
        metric: 'rating_average',
        dimensions: null,
        value: row.avg_rating,
        sample_rate: row.sample_rate,
      })
    }
  }

  return summaries
}

// ---------------------------------------------------------------------------
// Page view metrics: count page_view per domain (extrapolated by sample_rate)
// ---------------------------------------------------------------------------
export async function aggregatePageViewMetrics(
  db: DrizzleD1Database,
  date: string,
  startTs: number,
  endTs: number,
): Promise<AggregatedSummary[]> {
  const rows = await db
    .select({
      domain: events.domain,
      sample_rate: events.sample_rate,
      count: count(),
    })
    .from(events)
    .where(
      and(
        eq(events.type, 'page_view'),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.domain, events.sample_rate)

  return rows.map((row) => ({
    date,
    domain: row.domain,
    metric: 'page_view_count',
    dimensions: null,
    value: row.count,
    sample_rate: row.sample_rate,
  }))
}

// ---------------------------------------------------------------------------
// Timer metrics: count timer_start / timer_complete per domain
// ---------------------------------------------------------------------------
export async function aggregateTimerMetrics(
  db: DrizzleD1Database,
  date: string,
  startTs: number,
  endTs: number,
): Promise<AggregatedSummary[]> {
  const rows = await db
    .select({
      type: events.type,
      domain: events.domain,
      sample_rate: events.sample_rate,
      count: count(),
    })
    .from(events)
    .where(
      and(
        inArray(events.type, ['timer_start', 'timer_complete']),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.type, events.domain, events.sample_rate)

  return rows.map((row) => ({
    date,
    domain: row.domain,
    metric: `${row.type}_count`,
    dimensions: null,
    value: row.count,
    sample_rate: row.sample_rate,
  }))
}

// ---------------------------------------------------------------------------
// API metrics: count api_call per version (extrapolated by sample_rate)
// ---------------------------------------------------------------------------
export async function aggregateApiMetrics(
  db: DrizzleD1Database,
  date: string,
  startTs: number,
  endTs: number,
): Promise<AggregatedSummary[]> {
  const rows = await db
    .select({
      sample_rate: events.sample_rate,
      version: sql<string>`json_extract(${events.body}, '$.version')`.as('version'),
      count: count(),
    })
    .from(events)
    .where(
      and(
        eq(events.type, 'api_call'),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.sample_rate, sql`json_extract(${events.body}, '$.version')`)

  return rows.map((row) => ({
    date,
    domain: null, // API calls are global, not per-domain
    metric: 'api_call_count',
    dimensions: row.version ? JSON.stringify({ version: row.version }) : null,
    value: row.count,
    sample_rate: row.sample_rate,
  }))
}

// ---------------------------------------------------------------------------
// Trial metrics: count trial_started / trial_converted per day (global)
// ---------------------------------------------------------------------------
export async function aggregateTrialMetrics(
  db: DrizzleD1Database,
  date: string,
  startTs: number,
  endTs: number,
): Promise<AggregatedSummary[]> {
  const rows = await db
    .select({
      type: events.type,
      sample_rate: events.sample_rate,
      count: count(),
    })
    .from(events)
    .where(
      and(
        inArray(events.type, ['trial_started', 'trial_converted']),
        gte(events.created_at, startTs),
        lte(events.created_at, endTs),
      ),
    )
    .groupBy(events.type, events.sample_rate)

  return rows.map((row) => ({
    date,
    domain: null, // Trial events are global
    metric: `${row.type}_count`,
    dimensions: null,
    value: row.count,
    sample_rate: row.sample_rate,
  }))
}

// ---------------------------------------------------------------------------
// Run all aggregators and return combined summaries
// ---------------------------------------------------------------------------
export async function runAllAggregators(
  db: DrizzleD1Database,
  date: string,
  startTs: number,
  endTs: number,
): Promise<AggregatedSummary[]> {
  const results = await Promise.all([
    aggregateCtaMetrics(db, date, startTs, endTs),
    aggregateImSessionMetrics(db, date, startTs, endTs),
    aggregateRatingMetrics(db, date, startTs, endTs),
    aggregatePageViewMetrics(db, date, startTs, endTs),
    aggregateTimerMetrics(db, date, startTs, endTs),
    aggregateApiMetrics(db, date, startTs, endTs),
    aggregateTrialMetrics(db, date, startTs, endTs),
  ])

  return results.flat()
}

export type { AggregatedSummary }
