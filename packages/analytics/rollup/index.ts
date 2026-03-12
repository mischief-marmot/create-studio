import { desc, eq, sql } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { runAllAggregators } from './aggregators'
import { resolveDomainToSiteId } from './resolve-sites'
import { upsertDailySummary } from '../queries/summaries'
import { purgeEventsBefore } from '../queries/events'
import { dailySummaries } from '../schema'

const RETENTION_DAYS = 30

/**
 * Get start and end timestamps for a given date string (YYYY-MM-DD) in UTC.
 */
function getDateRange(date: string): { startTs: number; endTs: number } {
  const start = new Date(`${date}T00:00:00Z`)
  const end = new Date(`${date}T23:59:59.999Z`)
  return {
    startTs: Math.floor(start.getTime() / 1000),
    endTs: Math.floor(end.getTime() / 1000),
  }
}

/**
 * Format a Date as YYYY-MM-DD.
 */
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Get all dates between two date strings (inclusive), as YYYY-MM-DD.
 */
function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  while (current <= end) {
    dates.push(formatDate(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

/**
 * Find the most recent date that has been rolled up.
 * Returns null if no summaries exist yet.
 */
async function getLastRollupDate(db: DrizzleD1Database): Promise<string | null> {
  const rows = await db
    .select({ date: dailySummaries.date })
    .from(dailySummaries)
    .orderBy(desc(dailySummaries.date))
    .limit(1)

  return rows[0]?.date ?? null
}

export interface RollupResult {
  datesProcessed: string[]
  summariesWritten: number
  purgedBefore: number
  errors: string[]
}

/**
 * Run the rollup for all un-rolled-up days.
 *
 * Finds the last rolled-up date from daily_summaries, then aggregates
 * every day from the day after that through yesterday (or through today
 * if includeToday is true). If no summaries exist, rolls up all days
 * that have events.
 *
 * Each step is wrapped in error handling so a failure in one day/aggregator
 * does not block the rest of the pipeline.
 */
export async function runDailyRollup(
  analyticsDb: DrizzleD1Database,
  mainDb: DrizzleD1Database,
  options?: { includeToday?: boolean },
): Promise<RollupResult> {
  const errors: string[] = []
  const now = new Date()

  // Determine the end date: yesterday for cron, today for manual
  const endDay = new Date(now)
  if (!options?.includeToday) {
    endDay.setUTCDate(endDay.getUTCDate() - 1)
  }
  const endDate = formatDate(endDay)

  // Find the start date: day after last rollup, or earliest event date.
  // When includeToday is set (manual trigger), always re-process today
  // since new events may have arrived since the last rollup.
  const lastRollup = await getLastRollupDate(analyticsDb)
  let startDate: string

  if (lastRollup) {
    const dayAfter = new Date(`${lastRollup}T00:00:00Z`)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)
    startDate = formatDate(dayAfter)

    // If manual trigger and today was already rolled up, re-process it
    const today = formatDate(now)
    if (options?.includeToday && lastRollup >= today) {
      startDate = today
    }
  } else {
    // No summaries yet — find the earliest event date
    const earliest = await analyticsDb
      .select({ minTs: sql<number>`MIN(created_at)` })
      .from(sql`events`)

    if (!earliest[0]?.minTs) {
      console.log('[analytics-rollup] No events to roll up')
      return { datesProcessed: [], summariesWritten: 0, purgedBefore: 0, errors: [] }
    }
    const earliestDate = new Date(earliest[0].minTs * 1000)
    startDate = formatDate(earliestDate)
  }

  // Nothing to roll up if start is after end
  if (startDate > endDate) {
    console.log(`[analytics-rollup] Already up to date (last rollup: ${lastRollup})`)
    return { datesProcessed: [], summariesWritten: 0, purgedBefore: 0, errors: [] }
  }

  const datesToProcess = getDatesBetween(startDate, endDate)
  console.log(`[analytics-rollup] Rolling up ${datesToProcess.length} day(s): ${datesToProcess[0]} → ${datesToProcess[datesToProcess.length - 1]}`)

  let totalSummariesWritten = 0

  for (const date of datesToProcess) {
    const { startTs, endTs } = getDateRange(date)

    // Run aggregators
    let summaries: Awaited<ReturnType<typeof runAllAggregators>> = []
    try {
      summaries = await runAllAggregators(analyticsDb, date, startTs, endTs)
    } catch (err) {
      const msg = `[${date}] Aggregation failed: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`[analytics-rollup] ${msg}`)
      continue
    }

    if (summaries.length === 0) continue

    // Clear existing summaries for this day before inserting fresh ones.
    // This avoids duplicates caused by SQLite's NULL != NULL in unique indexes.
    try {
      await analyticsDb.delete(dailySummaries).where(eq(dailySummaries.date, date))
    } catch (err) {
      const msg = `[${date}] Failed to clear old summaries: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`[analytics-rollup] ${msg}`)
    }

    // Resolve domains → site IDs
    const uniqueDomains = [...new Set(
      summaries
        .map(s => s.domain)
        .filter((d): d is string => d !== null && d !== undefined),
    )]

    let domainToSiteId = new Map<string, number>()
    try {
      domainToSiteId = await resolveDomainToSiteId(mainDb, uniqueDomains)
    } catch (err) {
      const msg = `[${date}] Domain resolution failed: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`[analytics-rollup] ${msg}`)
    }

    // Upsert summaries
    for (const summary of summaries) {
      try {
        const site_id = summary.domain ? (domainToSiteId.get(summary.domain) ?? null) : null
        await upsertDailySummary(analyticsDb, { ...summary, site_id })
        totalSummariesWritten++
      } catch (err) {
        const msg = `[${date}] Upsert failed for ${summary.metric} (domain=${summary.domain}): ${err instanceof Error ? err.message : String(err)}`
        errors.push(msg)
        console.error(`[analytics-rollup] ${msg}`)
      }
    }
  }

  // Purge old events
  const cutoff = new Date(now)
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS)
  const cutoffTs = Math.floor(cutoff.getTime() / 1000)

  try {
    await purgeEventsBefore(analyticsDb, cutoffTs)
  } catch (err) {
    const msg = `Purge failed: ${err instanceof Error ? err.message : String(err)}`
    errors.push(msg)
    console.error(`[analytics-rollup] ${msg}`)
  }

  const result: RollupResult = {
    datesProcessed: datesToProcess,
    summariesWritten: totalSummariesWritten,
    purgedBefore: cutoffTs,
    errors,
  }

  console.log(`[analytics-rollup] Completed: ${totalSummariesWritten} summaries written for ${datesToProcess.length} day(s)`, errors.length > 0 ? `with ${errors.length} errors` : '')

  return result
}

export { runAllAggregators } from './aggregators'
export type { AggregatedSummary } from './aggregators'
