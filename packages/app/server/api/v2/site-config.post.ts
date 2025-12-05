import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SubscriptionRepository } from '~~/server/utils/database'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const logger = useLogger('SiteConfig', runtimeConfig.debug)

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
  let showInteractiveMode = true
  let buttonText = 'Try Interactive Mode!'

  try {
    // Find site by URL - need to look up across all users
    const db = hubDatabase()
    const siteResult = await db.prepare('SELECT * FROM Sites WHERE url = ?').bind(siteUrl).first()

    if (siteResult) {
      const subscriptionRepo = new SubscriptionRepository()
      subscriptionTier = await subscriptionRepo.getActiveTier(siteResult.id as number)

      // Pro sites can customize Interactive Mode settings
      if (subscriptionTier === 'pro') {
        // Check if Interactive Mode is disabled (0 means disabled, 1 or null means enabled)
        if (siteResult.interactive_mode_enabled === 0) {
          showInteractiveMode = false
        }
        // Use custom button text if set
        if (siteResult.interactive_mode_button_text) {
          buttonText = siteResult.interactive_mode_button_text as string
        }
      }

      logger.debug(`Site ${siteUrl} has tier: ${subscriptionTier}, interactive mode: ${showInteractiveMode}`)
    }
  } catch (error) {
    logger.error('Error looking up site subscription:', error)
    // Continue with free tier defaults
  }

  // Pro tier gets in-DOM rendering
  if (subscriptionTier === 'pro') {
    renderMode = 'in-dom'
  }

  const config = {
    showInteractiveMode,
    buttonText,
    baseUrl: runtimeConfig.public.rootUrl,
    subscriptionTier,
    renderMode,
    features: {
      inDomRendering: renderMode === 'in-dom',
      customStyling: subscriptionTier !== 'free',
      analytics: true,
    }
  }

  return {
    success: true,
    config,
    siteUrl
  }
})