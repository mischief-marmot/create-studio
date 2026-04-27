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
import { MAX_PURGE_TARGETS, validateSiteUrls } from '~~/server/utils/site-url-validation'

export default defineEventHandler(async (event) => {
  requireAdminApiKey(event)

  const body = await readBody<{ siteUrls?: unknown }>(event)
  const siteUrls = validateSiteUrls(body?.siteUrls)

  if (siteUrls.length === 0) {
    throw createError({ statusCode: 400, message: 'siteUrls must be a non-empty array of http(s) URLs' })
  }
  if (siteUrls.length > MAX_PURGE_TARGETS) {
    throw createError({ statusCode: 400, message: `siteUrls cannot exceed ${MAX_PURGE_TARGETS} entries` })
  }

  await Promise.all(siteUrls.map(u => purgeSiteConfigCache(event, u)))

  return { success: true, purged: siteUrls.length }
})
