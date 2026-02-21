/**
 * POST /api/dev/toggle-tier
 * Toggle subscription tier between free and pro for a site
 *
 * DEV ONLY - This endpoint only works in development mode
 *
 * Body: { siteId: number }
 * Response: { success: boolean, tier: string, subscription: Subscription }
 */

import { SubscriptionRepository, SiteRepository } from '~~/server/utils/database'

export default defineEventHandler(async (event) => {
  // Only allow in development mode
  if (!import.meta.dev) {
    setResponseStatus(event, 404)
    return { error: 'Not found' }
  }

  try {
    // Require user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    const body = await readBody(event)
    const siteId = parseInt(body.siteId)

    if (!siteId || isNaN(siteId)) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Invalid siteId' }
    }

    // Verify user has access to site
    const siteRepo = new SiteRepository()
    const hasAccess = await siteRepo.userHasAccessToSite(userId, siteId)
    if (!hasAccess) {
      setResponseStatus(event, 403)
      return { success: false, error: 'Forbidden' }
    }

    const subscriptionRepo = new SubscriptionRepository()
    let subscription = await subscriptionRepo.getBySiteId(siteId)

    if (!subscription) {
      // Create a new free-plus subscription
      subscription = await subscriptionRepo.create({
        site_id: siteId,
        status: 'active',
        tier: 'free-plus',
      })
    } else {
      // Cycle the tier: free → free-plus → pro → free
      const tierCycle: Record<string, string> = { free: 'free-plus', 'free-plus': 'pro', pro: 'free' }
      const newTier = tierCycle[subscription.tier] || 'free-plus'
      const newStatus = newTier === 'free' ? 'free' : 'active'

      subscription = await subscriptionRepo.update(siteId, {
        tier: newTier,
        status: newStatus,
      })
    }

    // Notify the WordPress site of the tier change via webhook.
    const tier = subscription?.tier || 'free'
    try {
      const site = await siteRepo.findById(siteId)
      if (site?.url) {
        const { sendWebhook } = await import('~~/server/utils/webhooks')
        sendWebhook(site.url, { type: 'subscription_change', data: { tier } })
      }
    } catch (_) {
      // Fire-and-forget
    }

    return {
      success: true,
      tier,
      subscription,
    }
  } catch (error: any) {
    console.error('Toggle tier error:', error)
    setResponseStatus(event, 500)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
