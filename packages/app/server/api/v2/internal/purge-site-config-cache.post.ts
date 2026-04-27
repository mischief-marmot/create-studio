/**
 * POST /api/v2/internal/purge-site-config-cache
 *
 * Admin worker has no CF credentials, so it delegates the site-config edge
 * cache purge to the main app via this endpoint after admin-side writes.
 *
 * Auth: X-Admin-Api-Key. Body: { siteUrls: string[] }.
 */

import { purgeSiteConfigCache } from '~~/server/utils/site-config-cache'
import { requireAdminApiKey } from '~~/server/utils/admin-auth'

// Caps CF zone-API call amplification from a single authenticated request.
// Real callers (admin PATCH) only send 1–2 URLs; anything bigger is abuse.
const MAX_PURGE_TARGETS = 10

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  requireAdminApiKey(event)

  const body = await readBody<{ siteUrls?: unknown }>(event)
  const raw = body?.siteUrls
  const siteUrls: string[] = Array.isArray(raw)
    ? raw.filter((u): u is string => typeof u === 'string' && u.length > 0 && isValidHttpUrl(u))
    : []

  if (siteUrls.length === 0) {
    throw createError({ statusCode: 400, message: 'siteUrls must be a non-empty array of http(s) URLs' })
  }
  if (siteUrls.length > MAX_PURGE_TARGETS) {
    throw createError({ statusCode: 400, message: `siteUrls cannot exceed ${MAX_PURGE_TARGETS} entries` })
  }

  await Promise.all(siteUrls.map(u => purgeSiteConfigCache(event, u)))

  return { success: true, purged: siteUrls.length }
})
