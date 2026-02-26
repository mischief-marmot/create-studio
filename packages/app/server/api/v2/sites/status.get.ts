/**
 * GET /api/v2/sites/status
 * Check site connection status (called from WordPress plugin)
 *
 * Requires JWT authentication (Bearer token - accepts both user and site tokens)
 * Response: { connected: boolean, site_id?, subscription_tier?, site_url?, site_name? }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SubscriptionRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyAnyJWT, getTokenType } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Status', debug)

  try {
    // Verify JWT token (accepts both user and site tokens)
    const tokenPayload = await verifyAnyJWT(event)
    const tokenType = getTokenType(tokenPayload)

    // Extract site_id from either token type
    const siteId = tokenPayload.site_id

    if (!siteId) {
      setResponseStatus(event, 400)
      return {
        connected: false,
        error: 'Token does not contain site_id'
      }
    }

    // Rate limit: 60 checks per minute per site
    await rateLimitMiddleware(event, {
      maxRequests: 60,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: 'site_status:',
      getKey: () => siteId.toString(),
    })

    logger.debug('Checking site status', { siteId, tokenType })

    const siteRepo = new SiteRepository()
    const site = await siteRepo.findById(siteId)

    if (!site) {
      return {
        connected: false
      }
    }

    // Touch last_active_at once per day (avoid a DB write on every heartbeat call)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    if (!site.last_active_at || site.last_active_at < oneDayAgo) {
      await siteRepo.touch(siteId)
    }

    // Look up subscription tier
    const subscriptionRepo = new SubscriptionRepository()
    const subscriptionTier = await subscriptionRepo.getActiveTier(siteId)

    return {
      connected: true,
      site_id: siteId,
      subscription_tier: subscriptionTier,
      site_url: site.url,
      site_name: site.name
    }
  }
  catch (error: any) {
    logger.error('Error checking site status:', error)
    return sendErrorResponse(event, error)
  }
})
