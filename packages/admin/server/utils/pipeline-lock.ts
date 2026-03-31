/**
 * In-memory lock for pipeline publisher IDs.
 *
 * Prevents concurrent pipeline jobs from grabbing the same publishers.
 * IDs are locked when a job claims them and unlocked when processing
 * completes (or after TTL expires as a safety net).
 */

const lockedIds = new Map<number, number>() // publisherId → expiry timestamp

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Lock a set of publisher IDs. Returns only the IDs that were
 * successfully locked (not already locked by another job).
 */
export function lockPublisherIds(ids: number[], ttlMs: number = DEFAULT_TTL_MS): number[] {
  const now = Date.now()
  const locked: number[] = []

  // Clean up expired locks first
  for (const [id, expiry] of lockedIds) {
    if (expiry < now) lockedIds.delete(id)
  }

  const expiry = now + ttlMs
  for (const id of ids) {
    if (!lockedIds.has(id)) {
      lockedIds.set(id, expiry)
      locked.push(id)
    }
  }

  return locked
}

/**
 * Unlock publisher IDs after processing completes.
 */
export function unlockPublisherIds(ids: number[]): void {
  for (const id of ids) {
    lockedIds.delete(id)
  }
}

/**
 * Filter out locked IDs from a list of publishers.
 * Returns only publishers whose IDs are not currently locked.
 */
export function filterUnlocked<T extends { id: number }>(publishers: T[]): T[] {
  const now = Date.now()

  // Clean expired
  for (const [id, expiry] of lockedIds) {
    if (expiry < now) lockedIds.delete(id)
  }

  return publishers.filter((p) => !lockedIds.has(p.id))
}
