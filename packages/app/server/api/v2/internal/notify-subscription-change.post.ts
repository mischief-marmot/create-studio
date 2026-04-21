/**
 * POST /api/v2/internal/notify-subscription-change
 * Internal endpoint called by the admin app to send a subscription_change
 * webhook to a WordPress site after an admin modifies a subscription tier.
 *
 * Auth: X-Admin-Api-Key header (shared secret between admin and main app)
 *
 * Body: { siteId: number, tier: string }
 */

import { SiteRepository } from '~~/server/utils/database'
import { enqueueSubscriptionChange } from '~~/server/utils/message-queue'
import { requireAdminApiKey } from '~~/server/utils/admin-auth'
import { useLogger } from '@create-studio/shared/utils/logger'

export default defineEventHandler(async (event) => {
  const logger = useLogger('InternalWebhook', useRuntimeConfig().debug)

  requireAdminApiKey(event)

  const body = await readBody(event)
  const { siteId, tier, is_trialing, trial_days_remaining, trial_end } = body

  if (!siteId || !tier) {
    throw createError({ statusCode: 400, message: 'siteId and tier are required' })
  }

  if (!['free', 'free-plus', 'pro', 'trial'].includes(tier)) {
    throw createError({ statusCode: 400, message: 'Invalid tier' })
  }

  const siteRepo = new SiteRepository()
  const site = await siteRepo.findById(siteId)

  if (!site?.url) {
    throw createError({ statusCode: 404, message: 'Site not found or has no URL' })
  }

  logger.debug(`Admin triggered subscription_change webhook for site ${siteId} (tier=${tier})`)

  const webhookData: Record<string, any> = { tier }
  if (is_trialing !== undefined) webhookData.is_trialing = is_trialing
  if (trial_days_remaining !== undefined) webhookData.trial_days_remaining = trial_days_remaining
  if (trial_end !== undefined) webhookData.trial_end = trial_end

  const messageId = await enqueueSubscriptionChange(siteId, site.url, webhookData, event)

  return { success: true, enqueued: true, messageId }
})
