/** Caps CF zone-API call amplification from a single authenticated request.
 *  Real callers (admin PATCH) only send 1–2 URLs; anything bigger is abuse. */
export const MAX_PURGE_TARGETS = 10

export function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** Filters request body input down to non-empty, well-formed http(s) URL
 *  strings. Pure function so tests can exercise the real production logic
 *  rather than a hand-kept-in-sync copy. */
export function validateSiteUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input.filter(
    (u): u is string => typeof u === 'string' && u.length > 0 && isValidHttpUrl(u),
  )
}
