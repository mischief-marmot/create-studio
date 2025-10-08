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

    // Verify user owns this site
    const siteRepo = new SiteRepository()
    const site = await siteRepo.findById(siteId)

    if (!site || site.user_id !== user.id) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Unauthorized access to this site'
      }
    }

    const config = useRuntimeConfig()
    const baseUrl = config.public.rootUrl || 'http://localhost:3001'

    // Create Stripe Checkout session
    const checkoutUrl = await createCheckoutSession({
      siteId,
      userId: user.id,
      userEmail: user.email,
      priceId,
      successUrl: `${baseUrl}/settings/site?success=true`,
      cancelUrl: `${baseUrl}/settings/site?canceled=true`,
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
