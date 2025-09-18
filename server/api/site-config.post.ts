import { useLogger } from '#shared/utils/logger'

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

  // For now, return default configuration for all sites
  // TODO: In the future, look up site-specific config from database
  const defaultConfig = {
    showInteractiveMode: true,
    buttonText: "Try Interactive Mode!",
    baseUrl: process.env.CREATE_STUDIO_BASE_URL || 'https://create.studio',
    // Future config options:
    // license: { valid: false, tier: 'free' },
    // styling: { theme: 'default', position: 'after' },
    // features: { analytics: true, customization: false }
  }

  // Log for debugging
  logger.debug(`Site config requested for: ${siteUrl}`)
  
  return {
    success: true,
    config: defaultConfig,
    siteUrl
  }
})