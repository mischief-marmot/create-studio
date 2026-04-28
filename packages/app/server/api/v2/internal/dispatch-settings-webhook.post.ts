/** Admin delegation entry for settings_update — admin has no webhook keys. */

import {
  enqueueSettingsUpdate,
  normalizeInteractiveSettingsForWebhook,
} from '~~/server/utils/message-queue'
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

  // Skip the DB write + delivery if no recognized fields are present —
  // avoids enqueueing a no-op webhook (admin sends raw body subsets that
  // may pre-filter to nothing useful).
  if (Object.keys(normalizeInteractiveSettingsForWebhook(body.settings)).length === 0) {
    return { success: true, messageId: null, skipped: 'no recognized settings' }
  }

  const messageId = await enqueueSettingsUpdate(
    body.siteId,
    body.siteUrl,
    body.settings,
    event,
  )

  return { success: true, messageId }
})
