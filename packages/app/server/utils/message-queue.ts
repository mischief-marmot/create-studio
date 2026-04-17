/**
 * Generic message queue / dead-letter queue.
 *
 * Messages are persisted in the MessageQueue table and processed asynchronously
 * by a scheduled worker. Each message has a type that maps to a registered
 * handler. Failed handlers are retried with exponential backoff up to
 * max_attempts, after which the message is marked `dead` for admin inspection.
 *
 * Usage:
 *   await enqueue('wordpress_webhook', { siteUrl, payload: {...} })
 *
 *   // (on startup, register handlers)
 *   registerHandler('wordpress_webhook', async (payload) => { ... })
 */

import { and, eq, lte, asc, inArray } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useLogger } from '@create-studio/shared/utils/logger'

export type MessageType =
  | 'wordpress_webhook'

export const QUEUE_STATUSES = [
  'pending',
  'processing',
  'failed',
  'dead',
  'completed',
  'superseded',
] as const

export type QueueStatus = typeof QUEUE_STATUSES[number]

export interface EnqueueOptions {
  siteId?: number | null
  maxAttempts?: number
  /** ISO8601 — delay first attempt. Defaults to now. */
  runAt?: string
}

type Handler = (payload: Record<string, any>, context: { attempt: number; messageId: number }) => Promise<void>

const handlers = new Map<MessageType, Handler>()

/**
 * Register a handler for a message type. Call once at startup (e.g. from a
 * Nitro plugin) so the worker can dispatch messages.
 */
export function registerHandler(type: MessageType, handler: Handler): void {
  handlers.set(type, handler)
}

export function getHandler(type: MessageType): Handler | undefined {
  return handlers.get(type)
}

/**
 * Enqueue a message for background processing.
 */
export async function enqueue(
  type: MessageType,
  payload: Record<string, any>,
  options: EnqueueOptions = {},
): Promise<number> {
  const now = new Date().toISOString()
  const row = await db.insert(schema.messageQueue).values({
    type,
    payload,
    status: 'pending',
    attempts: 0,
    max_attempts: options.maxAttempts ?? 8,
    next_attempt_at: options.runAt ?? now,
    site_id: options.siteId ?? null,
    created_at: now,
    updated_at: now,
  }).returning({ id: schema.messageQueue.id }).get()

  return row!.id
}

/**
 * Shortcut for the common subscription_change webhook envelope.
 *
 * When `event` is provided the message is delivered immediately via
 * ctx.waitUntil(); delivery failures fall through to the scheduled drain
 * worker's normal retry backoff. Without `event`, the drain picks it up
 * within ~1 minute on the next cron tick.
 */
export async function enqueueSubscriptionChange(
  siteId: number,
  siteUrl: string,
  data: Record<string, unknown>,
  event?: H3Event,
): Promise<number> {
  const id = await enqueue(
    'wordpress_webhook',
    {
      siteUrl,
      payload: { type: 'subscription_change', data },
    },
    { siteId },
  )

  if (event) scheduleImmediateDelivery(event, id)

  return id
}

/**
 * Attempt to deliver a specific queued message out-of-band, piggy-backing on
 * the current request's Cloudflare execution context. Used to close the gap
 * between enqueue and the next cron drain tick for latency-sensitive events.
 */
export function scheduleImmediateDelivery(event: H3Event, messageId: number): void {
  const logger = useLogger('MessageQueue', useRuntimeConfig().debug)

  const deliver = (async () => {
    const row = await db
      .select()
      .from(schema.messageQueue)
      .where(eq(schema.messageQueue.id, messageId))
      .get()
    if (!row || row.status !== 'pending') return
    await processOne(row, logger)
  })().catch(() => {
    // processOne already persists the error onto the queue row; swallow here
    // so the worker's waitUntil doesn't see an unhandled rejection.
  })

  const ctx = (event.context.cloudflare as any)?.context
  if (ctx?.waitUntil) {
    ctx.waitUntil(deliver)
    return
  }
  // Non-Cloudflare environments (local dev): the promise runs on its own
  // microtask with no lifetime guarantee — if the dev server restarts before
  // it resolves the attempt is silently dropped. The cron drain is the
  // durability backstop; local dev just sees a ~60s delay when that happens.
}

/**
 * Backoff schedule keyed by the attempt number that just failed (1-based;
 * processOne calls with attempt = row.attempts + 1, starting at 1).
 *   failure #1 → wait 1m, #2 → 5m, #3 → 30m, #4 → 2h, #5 → 6h, #6 → 12h,
 *   #7+ → 24h. After max_attempts the message is marked dead.
 */
export function computeBackoffMs(attempt: number): number {
  const schedule = [
    60_000,        // after failure #1 → 1 min
    5 * 60_000,    // #2 → 5 min
    30 * 60_000,   // #3 → 30 min
    2 * 3600_000,  // #4 → 2 hr
    6 * 3600_000,  // #5 → 6 hr
    12 * 3600_000, // #6 → 12 hr
    24 * 3600_000, // #7+ → 24 hr
  ]
  const idx = Math.max(0, Math.min(attempt - 1, schedule.length - 1))
  return schedule[idx]!
}

/**
 * Process up to `batchSize` pending messages whose next_attempt_at <= now.
 * Designed to be called by the scheduled worker. Safe to call concurrently —
 * each message is claimed via a conditional update before the handler runs.
 *
 * Returns counts for logging.
 */
export async function processQueue(batchSize = 25): Promise<{
  processed: number
  succeeded: number
  failed: number
  deadLettered: number
  skipped: number
}> {
  const logger = useLogger('MessageQueue', useRuntimeConfig().debug)
  const now = new Date().toISOString()

  const candidates = await db
    .select()
    .from(schema.messageQueue)
    .where(
      and(
        eq(schema.messageQueue.status, 'pending'),
        lte(schema.messageQueue.next_attempt_at, now),
      ),
    )
    .orderBy(asc(schema.messageQueue.next_attempt_at))
    .limit(batchSize)
    .all()

  // Group by site so messages targeting the same WP host are delivered
  // serially (avoids hammering one target + surprise WAF/rate-limit blocks),
  // while distinct sites are processed in parallel.
  const groups = new Map<string, typeof candidates>()
  for (const row of candidates) {
    const key = row.site_id?.toString() ?? `no-site:${row.id}`
    const bucket = groups.get(key) ?? []
    bucket.push(row)
    groups.set(key, bucket)
  }

  const siteConcurrency = 5
  const groupLists = [...groups.values()]
  const results: ProcessResult[] = []
  for (let i = 0; i < groupLists.length; i += siteConcurrency) {
    const chunk = groupLists.slice(i, i + siteConcurrency)
    const chunkResults = await Promise.all(
      chunk.map(async (rows) => {
        const perSite: ProcessResult[] = []
        for (const row of rows) {
          perSite.push(await processOne(row, logger))
        }
        return perSite
      }),
    )
    for (const r of chunkResults) results.push(...r)
  }

  const succeeded = results.filter((r) => r === 'succeeded').length
  const failed = results.filter((r) => r === 'failed').length
  const deadLettered = results.filter((r) => r === 'dead').length
  const skipped = results.filter((r) => r === 'skipped').length

  return {
    processed: candidates.length,
    succeeded,
    failed,
    deadLettered,
    skipped,
  }
}

type ProcessResult = 'succeeded' | 'failed' | 'dead' | 'skipped'

async function processOne(
  row: typeof schema.messageQueue.$inferSelect,
  logger: ReturnType<typeof useLogger>,
): Promise<ProcessResult> {
  const claim = await db
    .update(schema.messageQueue)
    .set({ status: 'processing', updated_at: new Date().toISOString() })
    .where(
      and(
        eq(schema.messageQueue.id, row.id),
        eq(schema.messageQueue.status, 'pending'),
      ),
    )
    .returning({ id: schema.messageQueue.id })
    .get()

  if (!claim) return 'skipped'

  const attempt = row.attempts + 1
  const handler = handlers.get(row.type as MessageType)

  // Missing handler is most likely a deploy/config issue (unreleased worker,
  // renamed type, etc.) — treat as a transient failure so the message gets
  // the normal backoff window instead of being destroyed on the first tick.
  if (!handler) {
    return recordFailure(
      row,
      attempt,
      `No handler registered for type "${row.type}"`,
      logger,
      { severity: 'config' },
    )
  }

  try {
    await handler(row.payload as Record<string, any>, { attempt, messageId: row.id })
    await db
      .update(schema.messageQueue)
      .set({
        status: 'completed',
        attempts: attempt,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.messageQueue.id, row.id))
      .run()
    return 'succeeded'
  } catch (err: any) {
    const errorMessage = err?.message || String(err)
    return recordFailure(row, attempt, errorMessage, logger)
  }
}

async function recordFailure(
  row: typeof schema.messageQueue.$inferSelect,
  attempt: number,
  errorMessage: string,
  logger: ReturnType<typeof useLogger>,
  options: { severity?: 'transient' | 'config' } = {},
): Promise<ProcessResult> {
  const reachedMax = attempt >= row.max_attempts
  const nextAttemptAt = new Date(Date.now() + computeBackoffMs(attempt)).toISOString()

  await db
    .update(schema.messageQueue)
    .set({
      status: reachedMax ? 'dead' : 'pending',
      attempts: attempt,
      last_error: errorMessage.slice(0, 2000),
      next_attempt_at: nextAttemptAt,
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.messageQueue.id, row.id))
    .run()

  if (reachedMax) {
    logger.error(`Message ${row.id} (${row.type}) dead-lettered after ${attempt} attempts: ${errorMessage}`)
    return 'dead'
  }

  // Config errors (missing handler, etc.) get louder logging so operators
  // notice them; transient errors stay at warn.
  const msg = `Message ${row.id} (${row.type}) attempt ${attempt} failed, next attempt at ${nextAttemptAt}: ${errorMessage}`
  if (options.severity === 'config') {
    logger.error(msg)
  } else {
    logger.warn(msg)
  }
  return 'failed'
}

/**
 * Reclaim messages that were stuck in `processing` longer than `staleAfterMs`.
 * This can happen if a worker dies mid-handler. Called at the start of each
 * worker run.
 */
export async function reclaimStaleProcessing(staleAfterMs = 5 * 60_000): Promise<number> {
  const cutoff = new Date(Date.now() - staleAfterMs).toISOString()
  const result = await db
    .update(schema.messageQueue)
    .set({ status: 'pending', updated_at: new Date().toISOString() })
    .where(
      and(
        eq(schema.messageQueue.status, 'processing'),
        lte(schema.messageQueue.updated_at, cutoff),
      ),
    )
    .returning({ id: schema.messageQueue.id })
    .all()
  return result.length
}

/**
 * Mark any pending/failed wordpress_webhook messages for a site as
 * `superseded`. Called when the WP plugin pulls current subscription state
 * via /sites/status — at that point any queued push-webhook for that site
 * is obsolete because the plugin just got the authoritative answer over
 * an outbound path (Wordfence-proof). Returns number of rows superseded.
 */
export async function supersedePendingWebhooksForSite(siteId: number): Promise<number> {
  const now = new Date().toISOString()
  const result = await db
    .update(schema.messageQueue)
    .set({ status: 'superseded', updated_at: now })
    .where(
      and(
        eq(schema.messageQueue.site_id, siteId),
        eq(schema.messageQueue.type, 'wordpress_webhook'),
        inArray(schema.messageQueue.status, ['pending', 'failed']),
      ),
    )
    .returning({ id: schema.messageQueue.id })
    .all()
  return result.length
}

/**
 * Delete terminal rows (completed or superseded) older than `days`.
 * Prevents unbounded MessageQueue growth. Dead rows are retained for admin
 * inspection and manual retry.
 */
export async function pruneCompletedOlderThan(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 3600_000).toISOString()
  const result = await db
    .delete(schema.messageQueue)
    .where(
      and(
        inArray(schema.messageQueue.status, ['completed', 'superseded']),
        lte(schema.messageQueue.updated_at, cutoff),
      ),
    )
    .returning({ id: schema.messageQueue.id })
    .all()
  return result.length
}
