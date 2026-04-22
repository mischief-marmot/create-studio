/**
 * POST /api/v2/surveys/:surveyId/checkout
 * Create a Stripe Checkout Session for the survey's "Upgrade now" flow with
 * the survey's promotion code auto-applied.
 *
 * Requires: authenticated user AND a completed response for this survey+site.
 * Body: { site_id: number }
 * Returns: { url: string }
 */

import Stripe from 'stripe'
import { SurveyRepository, SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const surveyId = Number(getRouterParam(event, 'surveyId'))
    if (!surveyId || isNaN(surveyId)) {
      setResponseStatus(event, 400)
      return { error: 'Valid survey ID is required' }
    }

    const session = await getUserSession(event)
    if (!session?.user?.id) {
      setResponseStatus(event, 401)
      return { error: 'Authentication required' }
    }

    const body = await readBody(event)
    const siteId = Number(body?.site_id)
    if (!siteId || isNaN(siteId)) {
      setResponseStatus(event, 400)
      return { error: 'site_id is required' }
    }

    // Verify site access
    const siteUserRepo = new SiteUserRepository()
    const hasAccess = await siteUserRepo.isUserVerified(session.user.id, siteId)
    if (!hasAccess) {
      setResponseStatus(event, 403)
      return { error: 'You do not have access to this site' }
    }

    const surveyRepo = new SurveyRepository()
    const survey = await surveyRepo.findById(surveyId)
    if (!survey) {
      setResponseStatus(event, 404)
      return { error: 'Survey not found' }
    }

    // Gate on completion — only surveys the user has actually finished can unlock checkout
    const completed = await surveyRepo.findCompletedForUser(surveyId, session.user.id, siteId)
    if (!completed) {
      setResponseStatus(event, 403)
      return { error: 'You must complete the survey before upgrading with this code' }
    }

    const promotion = (survey.promotion as any) || {}
    const code: string | undefined = promotion.code
    const codeApiId: string | undefined = promotion.code_api_id
    if (!code && !codeApiId) {
      setResponseStatus(event, 400)
      return { error: 'This survey has no discount code configured' }
    }

    const config = useRuntimeConfig()
    const priceId = (config.public as any)?.stripePrice?.annual
    if (!priceId) {
      setResponseStatus(event, 500)
      return { error: 'Annual price ID is not configured' }
    }

    const siteRepo = new SiteRepository()
    const site = await siteRepo.findById(siteId)
    if (!site) {
      setResponseStatus(event, 404)
      return { error: 'Site not found' }
    }

    const apiKey = (config as any).stripeSecretKey || process.env.NUXT_STRIPE_SECRET_KEY
    if (!apiKey) {
      setResponseStatus(event, 500)
      return { error: 'Stripe is not configured' }
    }
    const stripe = new Stripe(apiKey, {
      apiVersion: '2026-01-28.clover',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Prefer the stored Stripe promotion code ID; fall back to looking it up by
    // the user-facing code if the admin hasn't filled in code_api_id yet.
    let promotionCodeId = codeApiId
    if (!promotionCodeId && code) {
      const matches = await stripe.promotionCodes.list({ code, active: true, limit: 1 })
      const promoCode = matches.data[0]
      if (!promoCode) {
        setResponseStatus(event, 404)
        return { error: `Promotion code "${code}" is not active in Stripe` }
      }
      promotionCodeId = promoCode.id
    }

    const baseUrl = (config.public as any)?.rootUrl || 'http://localhost:3001'
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/admin/settings?success=true`,
      cancel_url: `${baseUrl}/surveys/${survey.slug}?canceled=true`,
      discounts: [{ promotion_code: promotionCodeId! }],
      payment_method_collection: 'always',
      metadata: {
        site_id: siteId.toString(),
        user_id: session.user.id.toString(),
        survey_id: surveyId.toString(),
        response_id: completed.id.toString(),
      },
      subscription_data: {
        description: site.name ? `Create Pro - ${site.name}` : 'Create Pro',
        metadata: {
          site_id: siteId.toString(),
          user_id: session.user.id.toString(),
          site_name: site.name || '',
          survey_id: surveyId.toString(),
        },
      },
    })

    return { success: true, url: checkoutSession.url }
  } catch (error: any) {
    return sendErrorResponse(event, error)
  }
})
