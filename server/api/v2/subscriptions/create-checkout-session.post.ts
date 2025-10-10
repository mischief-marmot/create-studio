/**
 * POST /api/v2/subscriptions/create-checkout-session
 * Create a Stripe Checkout session for subscription
 *
 * Request body: { siteId: number, priceId: string }
 * Requires authentication (session)
 * Response: { success: boolean, url: string, error?: string }
 */

import { createCheckoutSession } from '~~/server/utils/stripe'
import { SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

const { debug } = useRuntimeConfig()
const logger = useLogger('API:CreateCheckoutSession', debug)

export default defineEventHandler(async (event) => {
  try {
    // Require user session
    const session = await requireUserSession(event)
    const user = session.user

    const body = await readBody(event)
    const { siteId, priceId } = body

    if (!siteId || !priceId) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'siteId and priceId are required'
      }
    }

    // V2 API: Verify this is a canonical site and user has access
    const siteRepo = new SiteRepository()
    const site = await siteRepo.findById(siteId)

    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // Must be canonical site
    if (site.canonical_site_id !== null && site.canonical_site_id !== undefined) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Can only create subscriptions for canonical sites'
      }
    }

    // Verify user has access via SiteUsers (typically must be owner)
    const userRole = await siteRepo.getUserRole(user.id, siteId)
    if (!userRole || userRole !== 'owner') {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Only site owners can manage subscriptions'
      }
    }

    const config = useRuntimeConfig()
    const baseUrl = config.public.rootUrl || 'http://localhost:3001'

    // Create Stripe Checkout session with selected price
    const checkoutUrl = await createCheckoutSession({
      siteId,
      userId: user.id,
      userEmail: user.email,
      siteName: site.name || site.url,
      priceId,
      successUrl: `${baseUrl}/admin/settings?success=true`,
      cancelUrl: `${baseUrl}/admin/settings?canceled=true`,
    })

    logger.debug('Checkout session created for site', siteId)

    return {
      success: true,
      url: checkoutUrl
    }

  } catch (error: any) {
    logger.error('Create checkout session error:', error)
    return sendErrorResponse(event, error)
  }
})
