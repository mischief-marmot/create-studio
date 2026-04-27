import { buildSiteConfig } from '~~/server/utils/site-config'
import { buildSiteConfigCacheKey } from '~~/server/utils/site-config-cache'

// Edge cache TTL — 10 minutes; site config changes are infrequent.
// This route is a CORS simple request (GET, no custom headers) so browsers
// skip preflight, and responses are cached at the edge via caches.default
// so subsequent identical requests bypass the Worker entirely.
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

  const runtimeConfig = useRuntimeConfig()
  const isProduction = !runtimeConfig.debug
  // Shared with site-config.post.ts and purgeSiteConfigCache. Keeping all key
  // construction in one place — drift here silently breaks invalidation.
  const cacheKey = buildSiteConfigCacheKey(runtimeConfig.public.rootUrl, siteUrl)

  // Edge cache lookup — returns the previously stored response if fresh.
  // The POST handler shares this cache key, so warm entries from one path
  // are served by the other.
  if (isProduction) {
    try {
      const cache = (caches as any).default as Cache | undefined
      if (cache) {
        const cached = await cache.match(cacheKey)
        if (cached) {
          setResponseHeaders(event, Object.fromEntries(cached.headers.entries()))
          return cached.json()
        }
      }
    } catch {
      // Cache API not available (local dev) — fall through.
    }
  }

  setResponseHeaders(event, {
    'Cache-Control': `public, max-age=${EDGE_CACHE_MAX_AGE}`,
    'CDN-Cache-Control': `public, max-age=${EDGE_CACHE_MAX_AGE}`,
  })

  const result = await buildSiteConfig(siteUrl, runtimeConfig.public.rootUrl)

  // Populate the edge cache for next time. The Cache Rule on this path makes
  // the response eligible; this put is what actually stores it.
  if (isProduction) {
    try {
      const cache = (caches as any).default as Cache | undefined
      if (cache) {
        const responseToCache = new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${EDGE_CACHE_MAX_AGE}`,
            'CDN-Cache-Control': `public, max-age=${EDGE_CACHE_MAX_AGE}`,
            'Access-Control-Allow-Origin': '*',
          },
        })
        const ctx = (event.context.cloudflare as any)?.context
        if (ctx?.waitUntil) {
          ctx.waitUntil(cache.put(cacheKey, responseToCache))
        } else {
          cache.put(cacheKey, responseToCache).catch(() => {})
        }
      }
    } catch {
      // Edge cache write failed — not critical, response was still served.
    }
  }

  return result
})
