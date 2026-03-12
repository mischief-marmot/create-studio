import { eq, like, sql } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { counters } from '../schema'

/**
 * Increment a counter by key, upserting if it doesn't exist.
 * Uses SQLite ON CONFLICT for atomic increment.
 */
export async function incrementCounter(db: DrizzleD1Database, key: string, amount: number = 1) {
  const now = Math.floor(Date.now() / 1000)

  await db
    .insert(counters)
    .values({ key, value: amount, updated_at: now })
    .onConflictDoUpdate({
      target: counters.key,
      set: {
        value: sql`${counters.value} + ${amount}`,
        updated_at: now,
      },
    })
}

/**
 * Read a single counter by key.
 */
export async function getCounter(db: DrizzleD1Database, key: string) {
  const rows = await db
    .select()
    .from(counters)
    .where(eq(counters.key, key))
    .limit(1)

  return rows[0] ?? null
}

/**
 * Read counters matching a key prefix (LIKE 'prefix%').
 */
export async function getCounters(db: DrizzleD1Database, prefix: string) {
  return db
    .select()
    .from(counters)
    .where(like(counters.key, `${prefix}%`))
}
