/**
 * POST /api/v2/internal/dispatch-settings-webhook
 *
 * Admin worker has no webhook signing keys, so admin PATCH delegates the
 * settings_update webhook to the main app via this endpoint after writing
 * SiteMeta. Mirrors the purge-site-config-cache delegation pattern and
 * the notify-subscription-change pattern that already exists.
 *
 * Auth: X-Admin-Api-Key. Body: { siteId, siteUrl, settings }.
 *
 * Goes through enqueueSettingsUpdate so the queue's retry/backoff covers
 * transient delivery failures, and waitUntil delivers immediately.
 */

import { enqueueSettingsUpdate } from '~~/server/utils/message-queue'
import { requireAdminApiKey } from '~~/server/utils/admin-auth'

export default defineEventHandler(async (event) => {
  requireAdminApiKey(event)

  const body = await readBody<{
    siteId?: number
    siteUrl?: string
    settings?: Record<string, unknown>
  }>(event)

  if (!body?.siteId || typeof body.siteId !== 'number') {
    throw createError({ statusCode: 400, message: 'siteId is required' })
  }
  if (!body?.siteUrl || typeof body.siteUrl !== 'string') {
    throw createError({ statusCode: 400, message: 'siteUrl is required' })
  }
  if (!body?.settings || typeof body.settings !== 'object') {
    throw createError({ statusCode: 400, message: 'settings is required' })
  }

  const messageId = await enqueueSettingsUpdate(
    body.siteId,
    body.siteUrl,
    body.settings,
    event,
  )

  return { success: true, messageId }
})
