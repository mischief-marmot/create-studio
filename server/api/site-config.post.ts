export default defineEventHandler(async (event) => {
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
    buttonSelector: ".mv-create-instructions > h3",
    // Future config options:
    // license: { valid: false, tier: 'free' },
    // styling: { theme: 'default', position: 'after' },
    // features: { analytics: true, customization: false }
  }

  // Log for debugging
  console.log(`Site config requested for: ${siteUrl}`)
  
  return {
    success: true,
    config: defaultConfig,
    siteUrl
  }
})