/**
 * In-memory lock for pipeline IDs.
 *
 * Prevents concurrent pipeline jobs from processing the same records.
 * Supports separate lock namespaces (publishers, plugins, etc.).
 * IDs are locked when a job claims them and unlocked when processing
 * completes (or after TTL expires as a safety net).
 */

const locks = new Map<string, Map<number, number>>() // namespace → (id → expiry)

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getLockMap(namespace: string): Map<number, number> {
  let map = locks.get(namespace)
  if (!map) {
    map = new Map()
    locks.set(namespace, map)
  }
  return map
}

function cleanExpired(map: Map<number, number>): void {
  const now = Date.now()
  for (const [id, expiry] of map) {
    if (expiry < now) map.delete(id)
  }
}

/**
 * Lock a set of IDs in a namespace. Returns only the IDs that were
 * successfully locked (not already locked by another job).
 */
export function lockIds(namespace: string, ids: number[], ttlMs: number = DEFAULT_TTL_MS): number[] {
  const map = getLockMap(namespace)
  cleanExpired(map)

  const locked: number[] = []
  const expiry = Date.now() + ttlMs
  for (const id of ids) {
    if (!map.has(id)) {
      map.set(id, expiry)
      locked.push(id)
    }
  }
  return locked
}

/**
 * Unlock IDs in a namespace after processing completes.
 */
export function unlockIds(namespace: string, ids: number[]): void {
  const map = locks.get(namespace)
  if (!map) return
  for (const id of ids) {
    map.delete(id)
  }
}

/**
 * Filter out locked IDs from a list of records.
 */
export function filterUnlockedIds<T extends { id: number }>(namespace: string, records: T[]): T[] {
  const map = getLockMap(namespace)
  cleanExpired(map)
  return records.filter((r) => !map.has(r.id))
}

// Convenience aliases for publishers (backwards compatible)
export function lockPublisherIds(ids: number[], ttlMs?: number): number[] {
  return lockIds('publishers', ids, ttlMs)
}

export function unlockPublisherIds(ids: number[]): void {
  unlockIds('publishers', ids)
}

export function filterUnlocked<T extends { id: number }>(records: T[]): T[] {
  return filterUnlockedIds('publishers', records)
}

// Plugin locks
export function lockPluginIds(ids: number[], ttlMs?: number): number[] {
  return lockIds('plugins', ids, ttlMs)
}

export function unlockPluginIds(ids: number[]): void {
  unlockIds('plugins', ids)
}

export function filterUnlockedPlugins<T extends { id: number }>(records: T[]): T[] {
  return filterUnlockedIds('plugins', records)
}
