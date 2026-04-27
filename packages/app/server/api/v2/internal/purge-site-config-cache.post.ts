/**
 * POST /api/v2/internal/purge-site-config-cache
 * Internal endpoint called by the admin app to invalidate the
 * /api/v2/site-config/<key> edge cache after admin-side site/setting writes.
 *
 * The admin worker doesn't hold CF API credentials and lives in a different
 * Worker isolate, so it delegates the purge to the main app (which has the
 * zone token and the same caches.default the visitor-facing site-config
 * route writes to).
 *
 * Auth: X-Admin-Api-Key header (shared secret between admin and main app)
 *
 * Body: { siteUrls: string[] } — usually 1 entry; 2 when an admin URL change
 * needs both old and new keys cleared.
 */

import { purgeSiteConfigCache } from '~~/server/utils/site-config-cache'
import { requireAdminApiKey } from '~~/server/utils/admin-auth'

export default defineEventHandler(async (event) => {
  requireAdminApiKey(event)

  const body = await readBody<{ siteUrls?: unknown }>(event)
  const siteUrls = Array.isArray(body?.siteUrls) ? body.siteUrls.filter((u): u is string => typeof u === 'string' && u.length > 0) : []

  if (siteUrls.length === 0) {
    throw createError({ statusCode: 400, message: 'siteUrls must be a non-empty string array' })
  }

  await Promise.all(siteUrls.map(u => purgeSiteConfigCache(event, u)))

  return { success: true, purged: siteUrls.length }
})
