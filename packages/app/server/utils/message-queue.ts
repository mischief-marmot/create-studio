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

import { and, eq, lte, asc } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useLogger } from '@create-studio/shared/utils/logger'

export type MessageType =
  | 'wordpress_webhook'

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
  }
  // In non-Cloudflare environments (local dev) the promise continues on its
  // own microtask — the cron drain is the safety net if the process exits.
}

/**
 * Backoff schedule. Attempt N (zero-indexed) => delay before next attempt.
 * 1m, 5m, 30m, 2h, 6h, 12h, 24h. After max_attempts the message is marked dead.
 */
export function computeBackoffMs(attempt: number): number {
  const schedule = [
    60_000,        // 1 min
    5 * 60_000,    // 5 min
    30 * 60_000,   // 30 min
    2 * 3600_000,  // 2 hr
    6 * 3600_000,  // 6 hr
    12 * 3600_000, // 12 hr
    24 * 3600_000, // 24 hr
  ]
  return schedule[Math.min(attempt, schedule.length - 1)]!
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

  const results = await Promise.all(candidates.map((row) => processOne(row, logger)))

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

  const handler = handlers.get(row.type as MessageType)
  if (!handler) {
    logger.error(`No handler registered for message type "${row.type}" (id=${row.id})`)
    await db
      .update(schema.messageQueue)
      .set({
        status: 'dead',
        last_error: `No handler registered for type "${row.type}"`,
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.messageQueue.id, row.id))
      .run()
    return 'dead'
  }

  const attempt = row.attempts + 1
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
    logger.warn(`Message ${row.id} (${row.type}) attempt ${attempt} failed, next attempt at ${nextAttemptAt}: ${errorMessage}`)
    return 'failed'
  }
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
