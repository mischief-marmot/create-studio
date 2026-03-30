/// <reference path="../../hub.d.ts" />
import { useLogger } from '@create-studio/shared/utils/logger'
import { SubscriptionRepository, SiteMetaRepository } from '~~/server/utils/database'
import { eq } from 'drizzle-orm'

// Edge cache TTL — 10 minutes; site config changes are infrequent
const EDGE_CACHE_MAX_AGE = 600

/** Build a synthetic GET cache key for Cloudflare Cache API, keyed on siteUrl */
function buildEdgeCacheKey(rootUrl: string, siteUrl: string): Request {
  const siteKey = btoa(siteUrl)
  return new Request(`${rootUrl}/api/v2/site-config/${siteKey}`, { method: 'GET' })
}

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
  const { siteUrl } = body || {}

  if (!siteUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'siteUrl is required'
    })
  }

  const isProduction = !runtimeConfig.debug

  // Check Cloudflare edge cache first
  if (isProduction) {
    try {
      const cache = (caches as any).default as Cache | undefined
      if (cache) {
        const edgeCacheKey = buildEdgeCacheKey(runtimeConfig.public.rootUrl, siteUrl)
        const cachedResponse = await cache.match(edgeCacheKey)
        if (cachedResponse) {
          return cachedResponse.json()
        }
      }
    } catch {
      // Cache API not available — fall through
    }
  }

  // Look up site and subscription tier
  let subscriptionTier = 'free'
  let renderMode: 'iframe' | 'in-dom' = 'iframe'
  let showInteractiveMode = true
  let buttonText = 'Try Interactive Mode!'
  let ctaVariant: 'button' | 'inline-banner' | 'sticky-bar' | 'tooltip' = 'inline-banner'
  let ctaTitle = ''
  let ctaSubtitle = ''

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

      // Free+, Trial, and Pro tiers get Interactive Mode
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
        // Use custom CTA variant if set
        ctaVariant = settings.interactive_mode_cta_variant || 'button'
        // Use custom CTA title/subtitle if set
        if (settings.interactive_mode_cta_title) {
          ctaTitle = settings.interactive_mode_cta_title
        }
        if (settings.interactive_mode_cta_subtitle) {
          ctaSubtitle = settings.interactive_mode_cta_subtitle
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

  // Trial tier has same features as free-plus
  const effectiveTier = subscriptionTier === 'trial' ? 'free-plus' : subscriptionTier

  const result = {
    success: true,
    config: {
      showInteractiveMode,
      buttonText,
      ctaVariant,
      ctaTitle,
      ctaSubtitle,
      baseUrl: runtimeConfig.public.rootUrl,
      subscriptionTier,
      renderMode,
      features: {
        inDomRendering: renderMode === 'in-dom',
        customStyling: effectiveTier === 'pro',
        servingsAdjustment: effectiveTier !== 'free',
        unitConversion: effectiveTier !== 'free',
        analytics: true,
      }
    },
    siteUrl
  }

  // Store in edge cache for next time
  if (isProduction) {
    try {
      const cache = (caches as any).default as Cache | undefined
      if (cache) {
        const edgeCacheKey = buildEdgeCacheKey(runtimeConfig.public.rootUrl, siteUrl)
        const response = new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${EDGE_CACHE_MAX_AGE}`,
            'Access-Control-Allow-Origin': '*',
          }
        })
        const ctx = (event.context.cloudflare as any)?.context
        if (ctx?.waitUntil) {
          ctx.waitUntil(cache.put(edgeCacheKey, response))
        } else {
          cache.put(edgeCacheKey, response).catch(() => {})
        }
      }
    } catch {
      // Edge cache write failed — not critical
    }
  }

  return result
})