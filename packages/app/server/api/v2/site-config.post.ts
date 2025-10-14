import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SubscriptionRepository } from '~~/server/utils/database'

export default defineEventHandler(async (event) => {
  const logger = useLogger('SiteConfig')

  // Set CORS headers to allow cross-origin requests from embedded scripts
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })

  const body = await readBody(event)
  const { siteUrl } = body

  if (!siteUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'siteUrl is required'
    })
  }

  // Look up site and subscription tier
  let subscriptionTier = 'free'
  let renderMode: 'iframe' | 'in-dom' = 'iframe'

  try {
    // Find site by URL - need to look up across all users
    const db = hubDatabase()
    const siteResult = await db.prepare('SELECT * FROM Sites WHERE url = ?').bind(siteUrl).first()

    if (siteResult) {
      const subscriptionRepo = new SubscriptionRepository()
      subscriptionTier = await subscriptionRepo.getActiveTier(siteResult.id as number)

      // Pro tier gets in-DOM rendering
      if (subscriptionTier === 'pro') {
        renderMode = 'in-dom'
      }

      logger.debug(`Site ${siteUrl} has tier: ${subscriptionTier}, render mode: ${renderMode}`)
    }
  } catch (error) {
    logger.error('Error looking up site subscription:', error)
    // Continue with free tier defaults
  }

  const config = {
    showInteractiveMode: true,
    buttonText: "Try Interactive Mode!",
    baseUrl: process.env.CREATE_STUDIO_BASE_URL || 'https://create.studio',
    subscriptionTier,
    renderMode,
    features: {
      inDomRendering: renderMode === 'in-dom',
      customStyling: subscriptionTier !== 'free',
      analytics: true,
    }
  }

  // Log for debugging
  logger.debug(`Site config requested for: ${siteUrl}`)

  return {
    success: true,
    config,
    siteUrl
  }
})