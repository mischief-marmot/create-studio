import { buildSiteConfig } from '~~/server/utils/site-config'

// Edge cache TTL — 10 minutes; site config changes are infrequent.
// This route is a CORS simple request (GET, no custom headers) so browsers
// skip preflight — both the GET and an OPTIONS preflight are eliminated
// compared to the POST variant. Responses are cacheable at the edge.
const EDGE_CACHE_MAX_AGE = 600

export default defineEventHandler(async (event) => {
  // Set CORS header before any validation so 4xx responses are readable by
  // the cross-origin widget instead of surfacing as opaque CORS failures.
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')

  const { siteKey } = getRouterParams(event)

  let siteUrl: string
  try {
    siteUrl = atob(siteKey)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid siteKey' })
  }

  if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid siteUrl' })
  }

  setResponseHeaders(event, {
    'Cache-Control': `public, max-age=${EDGE_CACHE_MAX_AGE}`,
    'CDN-Cache-Control': `public, max-age=${EDGE_CACHE_MAX_AGE}`,
  })

  const runtimeConfig = useRuntimeConfig()
  return buildSiteConfig(siteUrl, runtimeConfig.public.rootUrl)
})
