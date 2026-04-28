import { transformCreationToHowTo } from '~~/server/utils/creationTransformer'
import { findCanonicalSiteUrl } from '~~/server/utils/canonical-site-url'
import type { HowTo } from '~~/types/schema-org'
import { useLogger } from '@create-studio/shared/utils/logger'

interface FetchCreationBody {
  site_url: string
  creation_id: number
  cache_bust?: boolean
}

interface WPCreationResponse {
  id: number
  title: string
  author?: string
  description?: string
  instructions: string
  instructions_with_ads?: string
  notes?: string
  thumbnail_uri?: string
  thumbnail_id?: string
  prep_time?: string
  active_time?: string
  additional_time?: string
  total_time?: string
  yield?: string
  difficulty?: string
  estimated_cost?: string
  rating?: string
  rating_count?: string
  nutrition?: any[]
  supplies?: any[]
  products?: any[]
  category_name?: string
  keywords?: string
  created?: string
  modified?: string
  unit_conversions?: {
    enabled: boolean
    default_system: 'auto' | 'us_customary' | 'metric'
    source_system: 'us_customary' | 'metric'
    label: string
    conversions: Record<string, { amount: string; unit: string; max_amount?: string | null }>
  }
}

interface CachedCreation {
  data: HowTo
  modified: string
  cachedAt: string
}

// Edge cache TTL — 1 day; KV cache handles the longer 30-day window
const EDGE_CACHE_MAX_AGE = 86400

/**
 * Build a synthetic GET cache key for Cloudflare Cache API.
 * Uses the same btoa("domain:creationId") pattern as the /interactive route.
 */
function buildEdgeCacheKey(rootUrl: string, siteUrl: string, creationId: number): Request {
  const creationKey = btoa(`${siteUrl}:${creationId}`)
  return new Request(`${rootUrl}/api/v2/fetch-creation/${creationKey}`, { method: 'GET' })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('FetchCreation', config.debug)
  const startTime = performance.now()
  const checkpoints: Record<string, number> = {}

  // Set CORS headers
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control')

  // Set cache control headers
  setHeader(event, 'Cache-Control', `public, max-age=${EDGE_CACHE_MAX_AGE}, stale-while-revalidate=86400`)
  setHeader(event, 'CDN-Cache-Control', `public, max-age=${EDGE_CACHE_MAX_AGE}, stale-while-revalidate=86400`)

  const body = await readBody<FetchCreationBody>(event)
  checkpoints.readBody = performance.now()

  const { site_url, creation_id, cache_bust = false } = body

  if (!site_url || !creation_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: site_url and creation_id'
    })
  }

  const isProduction = !config.debug

  // Check Cloudflare edge cache first (fastest path — no KV or WP call)
  if (isProduction && !cache_bust) {
    try {
      const cache = (caches as any).default as Cache | undefined
      if (cache) {
        const edgeCacheKey = buildEdgeCacheKey(config.public.rootUrl, site_url, creation_id)
        const cachedResponse = await cache.match(edgeCacheKey)
        if (cachedResponse) {
          return cachedResponse.json()
        }
      }
    } catch {
      // Cache API not available — fall through to KV
    }
  }

  // Initialize KV storage
  const storage = kv
  const cacheKey = `creation:${site_url}:${creation_id}`
  const TTL = 30 * 24 * 60 * 60 // 30 days in seconds

  // Check KV cache if not busting
  let cachedCreation: CachedCreation | null = null
  if (!cache_bust) {
    try {
      checkpoints.cacheCheckStart = performance.now()
      cachedCreation = await storage.get<CachedCreation>(cacheKey)
      checkpoints.cacheCheckEnd = performance.now()

      if (cachedCreation) {
        // Trigger background validation (check if stale and refresh if needed)
        validateAndRefreshCacheInBackground(
          storage,
          cacheKey,
          site_url,
          cachedCreation,
          logger,
          TTL,
          creation_id,
          event,
          config
        ).catch(err => logger.error('Background validation failed:', err))

        // Store in edge cache for next time
        storeInEdgeCache(event, config, site_url, creation_id, cachedCreation.data)

        return cachedCreation.data
      }
    } catch (error) {
      logger.error('Cache read error:', error)
    }
  } else {
    logger.info(`🔄 Cache bust requested for ${cacheKey}`)
    // Purge edge cache on cache bust
    if (isProduction) {
      purgeEdgeCache(config, site_url, creation_id)
    }
  }

  // No cache — resolve canonical site URL before the WP REST call.
  // Lazy on purpose: cache hits skip this DB round trip entirely.
  const wpSiteUrl = await findCanonicalSiteUrl(site_url) ?? site_url
  const url = `${wpSiteUrl}/wp-json/mv-create/v1/creations/${creation_id}`

  try {
    logger.info(`🌐 Fetching from WordPress API: ${url}`)
    checkpoints.wpFetchStart = performance.now()
    const response = await $fetch<WPCreationResponse>(url)
    checkpoints.wpFetchEnd = performance.now()

    // Transform the response to HowTo format. wpSiteUrl is canonical so
    // any absolute URLs the transformer emits point at the right host.
    checkpoints.transformStart = performance.now()
    const transformedData = await transformCreationToHowTo(response, wpSiteUrl)
    checkpoints.transformEnd = performance.now()

    // Cache the transformed data in KV
    try {
      checkpoints.cacheWriteStart = performance.now()
      const wrappedData: CachedCreation = {
        data: transformedData,
        modified: response.modified || new Date().toISOString(),
        cachedAt: new Date().toISOString()
      }
      await storage.set(cacheKey, wrappedData, { ttl: TTL })
      checkpoints.cacheWriteEnd = performance.now()
    } catch (error) {
      logger.error('Cache write error:', error)
    }

    // Store in edge cache
    storeInEdgeCache(event, config, site_url, creation_id, transformedData)

    return transformedData
  } catch (error: any) {
    // If we have stale cache, return it on error
    if (cachedCreation) {
      const totalTime = performance.now() - startTime
      logger.warn(`⚠️  Error fetching fresh data, returning stale cache after ${totalTime.toFixed(2)}ms`)
      logger.error(`Error details: ${error?.message || 'Unknown error'}`)
      return cachedCreation.data
    }

    const failureTime = performance.now() - startTime
    logger.error(`❌ Failed after ${failureTime.toFixed(2)}ms: ${error?.message || 'Unknown error'}`)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: `Failed to fetch creation data: ${error?.message || 'Unknown error'}`
    })
  }
})

/** Store a response in the Cloudflare edge cache (fire-and-forget) */
function storeInEdgeCache(event: any, config: any, siteUrl: string, creationId: number, data: HowTo) {
  if (config.debug) return
  try {
    const cache = (caches as any).default as Cache | undefined
    if (!cache) return
    const edgeCacheKey = buildEdgeCacheKey(config.public.rootUrl, siteUrl, creationId)
    const response = new Response(JSON.stringify(data), {
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
  } catch {
    // Edge cache write failed — not critical
  }
}

/** Purge a creation from the edge cache */
function purgeEdgeCache(config: any, siteUrl: string, creationId: number) {
  try {
    const cache = (caches as any).default as Cache | undefined
    if (!cache) return
    const edgeCacheKey = buildEdgeCacheKey(config.public.rootUrl, siteUrl, creationId)
    cache.delete(edgeCacheKey).catch(() => {})
  } catch {
    // Not critical
  }
}

// Validate cache freshness and refresh if stale - doesn't block the response
async function validateAndRefreshCacheInBackground(
  storage: any,
  cacheKey: string,
  siteUrl: string,
  cachedCreation: CachedCreation,
  logger: any,
  ttl: number,
  creationId: number,
  event: any,
  config: any
) {
  try {
    // Resolve canonical URL for the WP call. Lookup runs in the background,
    // not on the cache-hit response path, so it doesn't add latency.
    const wpSiteUrl = await findCanonicalSiteUrl(siteUrl) ?? siteUrl
    const url = `${wpSiteUrl}/wp-json/mv-create/v1/creations/${creationId}`
    const response = await $fetch<WPCreationResponse>(url)

    // Check if cache is stale
    if (response.modified !== cachedCreation.modified) {
      const transformedData = await transformCreationToHowTo(response, wpSiteUrl)

      const wrappedData: CachedCreation = {
        data: transformedData,
        modified: response.modified || new Date().toISOString(),
        cachedAt: new Date().toISOString()
      }
      await storage.set(cacheKey, wrappedData, { ttl })

      // Also refresh edge cache with the new data
      storeInEdgeCache(event, config, siteUrl, creationId, transformedData)
    }
  } catch (error: any) {
    // Background validation failed — stale data was already returned
  }
}

