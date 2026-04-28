/** Admin delegation entry for settings_update — admin has no webhook keys. */

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
  if (!body?.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) {
    throw createError({ statusCode: 400, message: 'settings must be a plain object' })
  }

  // enqueueSettingsUpdate returns null when normalize strips the input
  // to nothing — avoids a no-op MessageQueue row for empty payloads.
  const messageId = await enqueueSettingsUpdate(body.siteId, body.siteUrl, body.settings, event)
  return { success: true, messageId }
})
