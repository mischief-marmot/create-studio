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

    // Touch last_active_at once per day on the canonical site (avoid a DB write on every heartbeat call)
    const canonicalSiteId = site.canonical_site_id || site.id!
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const siteToCheck = canonicalSiteId !== site.id ? await siteRepo.findById(canonicalSiteId) : site
    if (!siteToCheck?.last_active_at || siteToCheck.last_active_at < oneDayAgo) {
      await siteRepo.touch(canonicalSiteId)
    }

    // Look up subscription tier, trial info, and trial eligibility
    const subscriptionRepo = new SubscriptionRepository()
    const subscriptionTier = await subscriptionRepo.getActiveTier(siteId)
    const trialInfo = await subscriptionRepo.getTrialInfo(siteId)
    const trialEligibility = await subscriptionRepo.isTrialEligible(siteId)

    // Look up active paid subscription count and total site count for the site owner (for multi-site discount messaging)
    let activePaidCount = 0
    let totalSiteCount = 1
    try {
      const siteUsers = await siteRepo.getSiteUsers(canonicalSiteId)
      if (siteUsers.length > 0) {
        // Use the first user (owner) to count their active paid subscriptions and total sites
        const ownerId = siteUsers[0].userId
        activePaidCount = await subscriptionRepo.getActivePaidCountByUser(ownerId)
        const userSites = await siteRepo.getUserCanonicalSites(ownerId)
        totalSiteCount = userSites.length
      }
    } catch (err) {
      logger.debug('Failed to get active paid count', { error: err })
    }

    return {
      connected: true,
      site_id: siteId,
      subscription_tier: subscriptionTier,
      site_url: site.url,
      site_name: site.name,
      active_paid_count: activePaidCount,
      total_site_count: totalSiteCount,
      is_trialing: trialInfo.isTrialing,
      trial_days_remaining: trialInfo.daysRemaining,
      trial_end: trialInfo.trialEnd,
      trial_extensions: trialInfo.extensions || {},
      trial_eligible: trialEligibility.eligible,
    }
  }
  catch (error: any) {
    logger.error('Error checking site status:', error)
    return sendErrorResponse(event, error)
  }
})
