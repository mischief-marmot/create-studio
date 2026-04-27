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
      // Create a new trial subscription
      subscription = await subscriptionRepo.create({
        site_id: siteId,
        status: 'trialing',
        tier: 'pro',
        trial_end: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      })
    } else {
      // Cycle the tier: free → trial → free-plus → pro → free
      const currentTier = subscription.status === 'trialing' ? 'trial' : subscription.tier
      const tierCycle: Record<string, string> = { free: 'trial', trial: 'free-plus', 'free-plus': 'pro', pro: 'free' }
      const newTier = tierCycle[currentTier] || 'trial'
      const newStatus = newTier === 'free' ? 'free' : newTier === 'trial' ? 'trialing' : 'active'

      subscription = await subscriptionRepo.update(siteId, {
        tier: newTier === 'trial' ? 'pro' : newTier,
        status: newStatus,
        ...(newTier === 'trial' ? { trial_end: new Date(Date.now() + 14 * 86400 * 1000).toISOString() } : {}),
      })
    }

    // Notify the WordPress site of the tier change via webhook.
    // Use effective tier: trialing status maps to 'trial' tier
    const tier = subscription?.status === 'trialing' ? 'trial' : (subscription?.tier || 'free')
    try {
      const site = await siteRepo.findById(siteId)
      if (site?.url) {
        const { sendWebhook } = await import('~~/server/utils/webhooks')
        const isTrialing = subscription?.status === 'trialing'

        // Get active paid count for the site owner
        let activePaidCount = 0
        const siteUsers = await siteRepo.getSiteUsers(site.canonical_site_id || site.id!)
        if (siteUsers.length > 0) {
          activePaidCount = await subscriptionRepo.getActivePaidCountByUser(siteUsers[0].userId)
        }

        sendWebhook(site.url, {
          type: 'subscription_change',
          data: {
            tier,
            is_trialing: isTrialing,
            trial_days_remaining: isTrialing ? 14 : 0,
            trial_end: isTrialing ? subscription?.trial_end : null,
            active_paid_count: activePaidCount,
          },
        })
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
