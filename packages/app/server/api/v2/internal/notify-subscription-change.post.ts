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
import { sendWebhook } from '~~/server/utils/webhooks'
import { useLogger } from '@create-studio/shared/utils/logger'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('InternalWebhook', config.debug)

  // Require admin API key
  const adminApiKey = getHeader(event, 'X-Admin-Api-Key')
  if (!adminApiKey || !config.adminApiKey || adminApiKey !== config.adminApiKey) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

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

  try {
    await sendWebhook(site.url, { type: 'subscription_change', data: webhookData })
  } catch (err) {
    logger.warn(`Webhook delivery failed for site ${siteId}:`, err)
    return { success: true, webhookSent: false, message: 'Tier updated but webhook delivery failed' }
  }

  return { success: true, webhookSent: true }
})
