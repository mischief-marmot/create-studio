/// <reference path="../../hub.d.ts" />
import { buildSiteConfig } from '~~/server/utils/site-config'

// Edge cache TTL — 10 minutes; site config changes are infrequent
const EDGE_CACHE_MAX_AGE = 600

/** Build a synthetic GET cache key for Cloudflare Cache API, keyed on siteUrl.
 *  The same URL shape is now a real GET route — this keeps POST + GET hitting
 *  the same edge cache entries. */
function buildEdgeCacheKey(rootUrl: string, siteUrl: string): Request {
  const siteKey = btoa(siteUrl)
  return new Request(`${rootUrl}/api/v2/site-config/${siteKey}`, { method: 'GET' })
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })

  const body = await readBody(event)
  const { siteUrl } = body || {}

  if (!siteUrl) {
    throw createError({ statusCode: 400, statusMessage: 'siteUrl is required' })
  }

  const isProduction = !runtimeConfig.debug

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

  const result = await buildSiteConfig(siteUrl, runtimeConfig.public.rootUrl)

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
          },
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
