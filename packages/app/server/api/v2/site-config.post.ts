/// <reference path="../../hub.d.ts" />
import { useLogger } from '@create-studio/shared/utils/logger'
import { SubscriptionRepository, SiteMetaRepository } from '~~/server/utils/database'
import { eq } from 'drizzle-orm'

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
    const siteResult = await db.select().from(schema.sites).where(eq(schema.sites.url, siteUrl)).get()

    if (siteResult) {
      const subscriptionRepo = new SubscriptionRepository()
      subscriptionTier = await subscriptionRepo.getActiveTier(siteResult.id as number)

      // Read settings from SiteMeta (falls back to Sites columns)
      const siteMetaRepo = new SiteMetaRepository()
      const settings = await siteMetaRepo.getSettings(siteResult.id as number)

      // Free tier gets no interactive mode at all
      if (subscriptionTier === 'free') {
        showInteractiveMode = false
      }

      // Free+ and Pro tiers get Interactive Mode
      // Check if Interactive Mode is disabled by the publisher
      if (settings.interactive_mode_enabled === false) {
        showInteractiveMode = false
      }

      // Pro sites can customize Interactive Mode settings
      if (subscriptionTier === 'pro') {
        // Use custom button text if set
        if (settings.interactive_mode_button_text) {
          buttonText = settings.interactive_mode_button_text
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
      customStyling: subscriptionTier === 'pro',
      servingsAdjustment: subscriptionTier !== 'free',
      unitConversion: subscriptionTier !== 'free',
      analytics: true,
    }
  }

  return {
    success: true,
    config,
    siteUrl
  }
})