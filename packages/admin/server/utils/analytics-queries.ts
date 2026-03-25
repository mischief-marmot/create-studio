/**
 * Analytics query functions for admin dashboard.
 * Queries daily_summaries in D1 via Drizzle, replacing the old KV-based approach.
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { and, eq, gte, lte, sql, sum, isNull } from 'drizzle-orm'
import { dailySummaries } from '@create-studio/analytics/schema'

// ---------------------------------------------------------------------------
// Helper: sum rows with extrapolation based on sample_rate
// ---------------------------------------------------------------------------

interface SummaryRow {
  value: number
  sample_rate?: number | null
  dimensions?: string | null
}

/**
 * Sum values from summary rows, extrapolating based on sample_rate.
 * A sample_rate of 0.1 means the value represents 10% of actual traffic,
 * so we multiply by 1/0.1 = 10.
 */
function sumExtrapolated(rows: SummaryRow[]): number {
  return rows.reduce((acc, row) => {
    const rate = row.sample_rate ?? 1
    const multiplier = rate > 0 ? 1 / rate : 1
    return acc + row.value * multiplier
  }, 0)
}

/**
 * Sum values from summary rows without extrapolation.
 */
function sumRaw(rows: SummaryRow[]): number {
  return rows.reduce((acc, row) => acc + row.value, 0)
}

// ---------------------------------------------------------------------------
// 1. Interactive Metrics
// ---------------------------------------------------------------------------

export async function getInteractiveMetrics(
  db: DrizzleD1Database,
  startDate: string,
  endDate: string,
  _options?: { siteId?: number },
) {
  // Query 1: im_session_start summaries
  const sessionStartRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'im_session_start_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  // Query 2: im_session_complete summaries
  const sessionCompleteRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'im_session_complete_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  // Query 3: domain breakdown for unique domains
  const domainRows = await db
    .select({
      domain: dailySummaries.domain,
      total: sum(dailySummaries.value).as('total'),
    })
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'im_session_start_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))
    .groupBy(dailySummaries.domain)

  // Query 4: page_view summaries (sampled)
  const pageViewRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'page_view_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  // Query 5: average session duration
  const durationRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'im_session_avg_duration'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  const totalSessions = sumRaw(sessionStartRows)
  const totalCompletions = sumRaw(sessionCompleteRows)
  const uniqueDomains = domainRows.length
  const totalPageViews = sumExtrapolated(pageViewRows)

  // Weighted average of daily averages (weighted by completions per day/domain)
  let avgSessionDuration = 0
  if (durationRows.length > 0 && totalCompletions > 0) {
    const totalWeightedDuration = durationRows.reduce((sum, row) => sum + row.value * (row.sample_rate ?? 1), 0)
    avgSessionDuration = Math.round(totalWeightedDuration / durationRows.length)
  }

  return {
    totalSessions,
    uniqueDomains,
    completionRate: totalSessions > 0 ? Math.min((totalCompletions / totalSessions) * 100, 100) : 0,
    totalPageViews,
    avgSessionDuration,
  }
}

// ---------------------------------------------------------------------------
// 2. Timer Metrics
// ---------------------------------------------------------------------------

export async function getTimerMetrics(
  db: DrizzleD1Database,
  startDate: string,
  endDate: string,
  _options?: { siteId?: number },
) {
  // Query 1: timer_start summaries (sampled at 0.1)
  const startRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'timer_start_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  // Query 2: timer_complete summaries (sampled at 0.1)
  const completeRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'timer_complete_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  const started = sumExtrapolated(startRows)
  const completed = sumExtrapolated(completeRows)

  return {
    started,
    completed,
    completionRate: started > 0 ? (completed / started) * 100 : 0,
  }
}

// ---------------------------------------------------------------------------
// 3. Rating Metrics
// ---------------------------------------------------------------------------

export async function getRatingMetrics(
  db: DrizzleD1Database,
  startDate: string,
  endDate: string,
  _options?: { siteId?: number },
) {
  // Query 1: rating_screen_shown summaries (rate 1.0, no extrapolation)
  const shownRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'rating_screen_shown_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  // Query 2: rating_submitted summaries (rate 1.0, no extrapolation)
  const submittedRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'rating_submitted_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  const screensShown = sumRaw(shownRows)
  const submitted = sumRaw(submittedRows)

  return {
    screensShown,
    submitted,
    conversionRate: screensShown > 0 ? (submitted / screensShown) * 100 : 0,
  }
}

// ---------------------------------------------------------------------------
// 4. CTA Metrics
// ---------------------------------------------------------------------------

export async function getCTAMetrics(
  db: DrizzleD1Database,
  startDate: string,
  endDate: string,
  _options?: { siteId?: number },
) {
  // Query 1: cta_rendered summaries
  const renderRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'cta_rendered_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  // Query 2: cta_activated summaries
  const activationRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'cta_activated_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  // Query 3: dimension breakdown for renders by variant
  const renderBreakdown = await db
    .select({
      dimension: sql<string>`json_extract(${dailySummaries.dimensions}, '$.variant')`.as('dimension'),
      total: sum(dailySummaries.value).as('total'),
    })
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'cta_rendered_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))
    .groupBy(sql`json_extract(${dailySummaries.dimensions}, '$.variant')`)

  // Query 4: dimension breakdown for activations by variant
  const activationBreakdown = await db
    .select({
      dimension: sql<string>`json_extract(${dailySummaries.dimensions}, '$.variant')`.as('dimension'),
      total: sum(dailySummaries.value).as('total'),
    })
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'cta_activated_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))
    .groupBy(sql`json_extract(${dailySummaries.dimensions}, '$.variant')`)

  const totalRenders = sumRaw(renderRows)
  const totalActivations = sumRaw(activationRows)

  // Build per-variant breakdown
  const variants: Record<string, { renders: number; activations: number; conversionRate: number }> = {}

  for (const row of renderBreakdown) {
    if (!row.dimension) continue
    variants[row.dimension] = {
      renders: Number(row.total) || 0,
      activations: 0,
      conversionRate: 0,
    }
  }

  for (const row of activationBreakdown) {
    if (!row.dimension) continue
    if (!variants[row.dimension]) {
      variants[row.dimension] = {
        renders: 0,
        activations: 0,
        conversionRate: 0,
      }
    }
    variants[row.dimension].activations = Number(row.total) || 0
  }

  for (const key of Object.keys(variants)) {
    const v = variants[key]
    v.conversionRate = v.renders > 0 ? (v.activations / v.renders) * 100 : 0
  }

  return {
    totalRenders,
    totalActivations,
    variants,
  }
}

// ---------------------------------------------------------------------------
// 5. API Usage Metrics
// ---------------------------------------------------------------------------

export async function getApiUsageMetrics(
  db: DrizzleD1Database,
  startDate: string,
  endDate: string,
  _options?: { siteId?: number },
) {
  // Query 1: all api_call summaries with dimensions
  const apiCallRows = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'api_call_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))

  // Query 2: dimension breakdown by version
  const versionBreakdown = await db
    .select({
      dimension: sql<string>`json_extract(${dailySummaries.dimensions}, '$.version')`.as('dimension'),
      total: sum(dailySummaries.value).as('total'),
    })
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.metric, 'api_call_count'),
      gte(dailySummaries.date, startDate),
      lte(dailySummaries.date, endDate),
    ))
    .groupBy(sql`json_extract(${dailySummaries.dimensions}, '$.version')`)

  // Get sample_rate from first row (all api_call rows should have the same rate)
  const sampleRate = apiCallRows.length > 0 ? (apiCallRows[0].sample_rate ?? 0.001) : 0.001
  const multiplier = sampleRate > 0 ? 1 / sampleRate : 1

  // Calculate v1 and v2 totals from breakdown
  let v1Total = 0
  let v2Total = 0

  for (const row of versionBreakdown) {
    const extrapolated = Number(row.total) * multiplier
    if (row.dimension === 'v1') v1Total = extrapolated
    else if (row.dimension === 'v2') v2Total = extrapolated
  }

  // Build per-endpoint breakdown from the raw rows
  const v1Endpoints: Record<string, { count: number }> = {}

  for (const row of apiCallRows) {
    if (!row.dimensions) continue
    try {
      const dims = typeof row.dimensions === 'string' ? JSON.parse(row.dimensions) : row.dimensions
      if (dims.version === 'v1' && dims.endpoint) {
        if (!v1Endpoints[dims.endpoint]) {
          v1Endpoints[dims.endpoint] = { count: 0 }
        }
        v1Endpoints[dims.endpoint].count += row.value * multiplier
      }
    } catch {
      // skip malformed dimensions
    }
  }

  return {
    v1Total,
    v2Total,
    v1Endpoints,
  }
}

// ---------------------------------------------------------------------------
// 6. Dashboard Orchestrator
// ---------------------------------------------------------------------------

export const _queryFns = {
  getApiUsageMetrics,
  getInteractiveMetrics,
  getTimerMetrics,
  getRatingMetrics,
  getCTAMetrics,
}

export async function getDashboardAnalytics(
  db: DrizzleD1Database,
  startDate: string,
  endDate: string,
  options?: { siteId?: number },
) {
  const [apiUsage, interactive, timers, ratings, cta] = await Promise.all([
    _queryFns.getApiUsageMetrics(db, startDate, endDate, options),
    _queryFns.getInteractiveMetrics(db, startDate, endDate, options),
    _queryFns.getTimerMetrics(db, startDate, endDate, options),
    _queryFns.getRatingMetrics(db, startDate, endDate, options),
    _queryFns.getCTAMetrics(db, startDate, endDate, options),
  ])

  return { apiUsage, interactive, timers, ratings, cta }
}
