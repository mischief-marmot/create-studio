import { eq, and, gte, lte, desc, like, sql, isNull } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { dailySummaries } from '../schema'

interface UpsertSummaryParams {
  date: string
  domain?: string | null
  site_id?: number | null
  metric: string
  dimensions?: string | null
  value: number
  sample_rate: number
}

/**
 * Insert or replace a daily summary row.
 * Uses ON CONFLICT on the unique index (date, domain, metric, dimensions).
 */
export async function upsertDailySummary(db: DrizzleD1Database, params: UpsertSummaryParams) {
  const now = Math.floor(Date.now() / 1000)

  await db
    .insert(dailySummaries)
    .values({
      date: params.date,
      domain: params.domain ?? null,
      site_id: params.site_id ?? null,
      metric: params.metric,
      dimensions: params.dimensions ?? null,
      value: params.value,
      sample_rate: params.sample_rate,
      created_at: now,
    })
    .onConflictDoUpdate({
      target: [dailySummaries.date, dailySummaries.domain, dailySummaries.metric, dailySummaries.dimensions],
      set: {
        value: params.value,
        site_id: params.site_id ?? null,
        sample_rate: params.sample_rate,
        created_at: now,
      },
    })
}

// ---------------------------------------------------------------------------
// Query helpers for dashboard patterns
// ---------------------------------------------------------------------------

interface QuerySummariesOptions {
  metric?: string
  /** Match metrics by prefix, e.g. "cta_" matches cta_rendered_count, cta_activated_count */
  metricPrefix?: string
  domain?: string
  /** Filter by resolved site_id (from the Sites table in the main DB) */
  siteId?: number
  /** When true, only return global (null domain) rows */
  globalOnly?: boolean
  startDate?: string
  endDate?: string
  /** Filter by a specific dimension key/value using json_extract on the dimensions column */
  dimensionFilter?: { key: string; value: string }
  limit?: number
}

/**
 * Query daily summaries with flexible filters.
 *
 * Supports the main dashboard query patterns:
 * - Time series: metric + date range
 * - Per-site breakdown: domain + date range
 * - Specific site dashboard: metric + domain + date range
 * - Dimension filtering: e.g. variant = 'inline' for CTA metrics
 */
export async function querySummaries(db: DrizzleD1Database, options: QuerySummariesOptions = {}) {
  const conditions = []

  if (options.metric) {
    conditions.push(eq(dailySummaries.metric, options.metric))
  }
  if (options.metricPrefix) {
    conditions.push(like(dailySummaries.metric, `${options.metricPrefix}%`))
  }
  if (options.domain) {
    conditions.push(eq(dailySummaries.domain, options.domain))
  }
  if (options.siteId) {
    conditions.push(eq(dailySummaries.site_id, options.siteId))
  }
  if (options.globalOnly) {
    conditions.push(isNull(dailySummaries.domain))
  }
  if (options.startDate) {
    conditions.push(gte(dailySummaries.date, options.startDate))
  }
  if (options.endDate) {
    conditions.push(lte(dailySummaries.date, options.endDate))
  }
  if (options.dimensionFilter) {
    conditions.push(
      sql`json_extract(${dailySummaries.dimensions}, ${`$.${options.dimensionFilter.key}`}) = ${options.dimensionFilter.value}`,
    )
  }

  const query = db
    .select()
    .from(dailySummaries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dailySummaries.date))

  if (options.limit) {
    return query.limit(options.limit)
  }

  return query
}

/**
 * Query a time series of a single metric, returning date + value pairs.
 * Useful for line/bar charts on the dashboard.
 */
export async function queryTimeSeries(
  db: DrizzleD1Database,
  metric: string,
  startDate: string,
  endDate: string,
  domain?: string,
  siteId?: number,
) {
  const conditions = [
    eq(dailySummaries.metric, metric),
    gte(dailySummaries.date, startDate),
    lte(dailySummaries.date, endDate),
  ]

  if (domain) {
    conditions.push(eq(dailySummaries.domain, domain))
  }
  if (siteId) {
    conditions.push(eq(dailySummaries.site_id, siteId))
  }

  return db
    .select({
      date: dailySummaries.date,
      value: dailySummaries.value,
      sample_rate: dailySummaries.sample_rate,
      dimensions: dailySummaries.dimensions,
    })
    .from(dailySummaries)
    .where(and(...conditions))
    .orderBy(dailySummaries.date)
}

/**
 * Query totals grouped by domain for a date range.
 * Returns sum of values per domain for a given metric — useful for "top sites" tables.
 */
export async function queryDomainBreakdown(
  db: DrizzleD1Database,
  metric: string,
  startDate: string,
  endDate: string,
  siteId?: number,
) {
  const conditions = [
    eq(dailySummaries.metric, metric),
    gte(dailySummaries.date, startDate),
    lte(dailySummaries.date, endDate),
  ]

  if (siteId) {
    conditions.push(eq(dailySummaries.site_id, siteId))
  }

  return db
    .select({
      domain: dailySummaries.domain,
      total: sql<number>`SUM(${dailySummaries.value})`.as('total'),
    })
    .from(dailySummaries)
    .where(and(...conditions))
    .groupBy(dailySummaries.domain)
    .orderBy(sql`total DESC`)
}

/**
 * Query totals grouped by a dimension key for a date range.
 * E.g. get CTA counts grouped by variant.
 */
export async function queryDimensionBreakdown(
  db: DrizzleD1Database,
  metric: string,
  dimensionKey: string,
  startDate: string,
  endDate: string,
) {
  const dimExpr = sql`json_extract(${dailySummaries.dimensions}, ${`$.${dimensionKey}`})`

  return db
    .select({
      dimension: dimExpr.as('dimension'),
      total: sql<number>`SUM(${dailySummaries.value})`.as('total'),
    })
    .from(dailySummaries)
    .where(
      and(
        eq(dailySummaries.metric, metric),
        gte(dailySummaries.date, startDate),
        lte(dailySummaries.date, endDate),
      ),
    )
    .groupBy(dimExpr)
    .orderBy(sql`total DESC`)
}
