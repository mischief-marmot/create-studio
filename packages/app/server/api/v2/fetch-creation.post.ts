import { transformCreationToHowTo } from '~~/server/utils/creationTransformer'
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
}

interface CachedCreation {
  data: HowTo
  modified: string
  cachedAt: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('FetchCreation', config.debug)
  const startTime = performance.now()
  const checkpoints: Record<string, number> = {}

  const body = await readBody<FetchCreationBody>(event)
  checkpoints.readBody = performance.now()

  const { site_url, creation_id, cache_bust = false } = body

  if (!site_url || !creation_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: site_url and creation_id'
    })
  }

  // Initialize KV storage
  const storage = hubKV()
  const cacheKey = `creation:${site_url}:${creation_id}`
  const TTL = 30 * 24 * 60 * 60 // 30 days in seconds

  logger.info(`📋 Request params - site_url: ${site_url}, creation_id: ${creation_id}, cache_bust: ${cache_bust}`)

  // Check cache if not busting
  let cachedCreation: CachedCreation | null = null
  if (!cache_bust) {
    try {
      checkpoints.cacheCheckStart = performance.now()
      cachedCreation = await storage.get<CachedCreation>(cacheKey)
      checkpoints.cacheCheckEnd = performance.now()

      if (cachedCreation) {
        const cacheCheckDuration = checkpoints.cacheCheckEnd - checkpoints.cacheCheckStart
        logger.info(`📦 Cache found: ${cacheKey}`)
        logger.info(`  - Cached modified: ${cachedCreation.modified}`)
        logger.info(`  - Cache lookup: ${cacheCheckDuration.toFixed(2)}ms`)

        // Return cached data immediately - we'll validate freshness in background
        const totalTime = performance.now() - startTime
        logger.info(`✅ CACHE HIT (returning immediately): ${cacheKey}`)
        logger.info(`📊 Performance: ${totalTime.toFixed(2)}ms`)

        // Trigger background validation (check if stale and refresh if needed)
        validateAndRefreshCacheInBackground(
          storage,
          cacheKey,
          site_url,
          cachedCreation,
          logger,
          TTL,
          creation_id
        ).catch(err => logger.error('Background validation failed:', err))

        return cachedCreation.data
      }
    } catch (error) {
      logger.error('Cache read error:', error)
    }
  } else {
    logger.info(`🔄 Cache bust requested for ${cacheKey}`)
  }

  // No cache - fetch fresh data from WordPress API
  const url = `${site_url}/wp-json/mv-create/v1/creations/${creation_id}`

  try {
    logger.info(`🌐 Fetching from WordPress API: ${url}`)
    checkpoints.wpFetchStart = performance.now()
    const response = await $fetch<WPCreationResponse>(url)
    checkpoints.wpFetchEnd = performance.now()

    logger.info(`  - WordPress API response received in ${(checkpoints.wpFetchEnd - checkpoints.wpFetchStart).toFixed(2)}ms`)

    // Transform the response to HowTo format
    checkpoints.transformStart = performance.now()
    const transformedData = await transformCreationToHowTo(response, site_url)
    checkpoints.transformEnd = performance.now()

    logger.info(`  - Data transformation completed in ${(checkpoints.transformEnd - checkpoints.transformStart).toFixed(2)}ms`)

    // Cache the transformed data
    try {
      checkpoints.cacheWriteStart = performance.now()
      const wrappedData: CachedCreation = {
        data: transformedData,
        modified: response.modified || new Date().toISOString(),
        cachedAt: new Date().toISOString()
      }
      await storage.set(cacheKey, wrappedData, { ttl: TTL })
      checkpoints.cacheWriteEnd = performance.now()
      logger.info(`  - Data cached in HubKV in ${(checkpoints.cacheWriteEnd - checkpoints.cacheWriteStart).toFixed(2)}ms`)
    } catch (error) {
      logger.error('Cache write error:', error)
    }

    const totalTime = performance.now() - startTime
    logger.info(`✅ Fresh fetch completed in ${totalTime.toFixed(2)}ms`)
    logger.info(`📊 Detailed breakdown:`)
    logger.info(`  - Read body: ${(checkpoints.readBody - startTime).toFixed(2)}ms`)
    logger.info(`  - WordPress fetch: ${(checkpoints.wpFetchEnd - checkpoints.wpFetchStart).toFixed(2)}ms`)
    logger.info(`  - Transform: ${(checkpoints.transformEnd - checkpoints.transformStart).toFixed(2)}ms`)
    if (checkpoints.cacheWriteEnd) {
      logger.info(`  - Cache write: ${(checkpoints.cacheWriteEnd - checkpoints.cacheWriteStart).toFixed(2)}ms`)
    }

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

// Validate cache freshness and refresh if stale - doesn't block the response
async function validateAndRefreshCacheInBackground(
  storage: any,
  cacheKey: string,
  siteUrl: string,
  cachedCreation: CachedCreation,
  logger: any,
  ttl: number,
  creationId: number
) {
  const validationStartTime = performance.now()

  try {
    logger.info(`🔍 Background validation started for ${cacheKey}`)

    // Fetch fresh modified timestamp from WordPress
    const url = `${siteUrl}/wp-json/mv-create/v1/creations/${creationId}`

    const response = await $fetch<WPCreationResponse>(url)
    const validationFetchTime = performance.now() - validationStartTime

    // Check if cache is stale
    if (response.modified !== cachedCreation.modified) {
      logger.info(`⚠️  Cache is stale for ${cacheKey}`)
      logger.info(`  - Cached modified: ${cachedCreation.modified}`)
      logger.info(`  - Fresh modified: ${response.modified}`)
      logger.info(`  - WordPress fetch: ${validationFetchTime.toFixed(2)}ms`)

      // Transform and update cache
      const transformStartTime = performance.now()
      const transformedData = await transformCreationToHowTo(response, siteUrl)
      const transformTime = performance.now() - transformStartTime

      const wrappedData: CachedCreation = {
        data: transformedData,
        modified: response.modified || new Date().toISOString(),
        cachedAt: new Date().toISOString()
      }
      await storage.set(cacheKey, wrappedData, { ttl })

      const totalTime = performance.now() - validationStartTime
      logger.info(`✅ Background refresh completed for ${cacheKey} in ${totalTime.toFixed(2)}ms`)
      logger.info(`  - WordPress fetch: ${validationFetchTime.toFixed(2)}ms`)
      logger.info(`  - Transform: ${transformTime.toFixed(2)}ms`)
    } else {
      logger.info(`✅ Cache is fresh for ${cacheKey}`)
      logger.info(`  - Validation time: ${validationStartTime.toFixed(2)}ms`)
    }
  } catch (error: any) {
    const validationTime = performance.now() - validationStartTime
    logger.error(`⚠️  Background validation failed after ${validationTime.toFixed(2)}ms:`, error?.message || error)
  }
}

// Background refresh function - doesn't block the response (kept for backward compatibility)
async function refreshCacheInBackground(
  storage: any,
  cacheKey: string,
  wpResponse: WPCreationResponse,
  siteUrl: string,
  logger: any,
  ttl: number
) {
  const refreshStartTime = performance.now()

  try {
    logger.info(`🔄 Background refresh started for ${cacheKey}`)

    // Transform the fresh data
    const transformedData = await transformCreationToHowTo(wpResponse, siteUrl)

    // Update cache with fresh data
    const wrappedData: CachedCreation = {
      data: transformedData,
      modified: wpResponse.modified || new Date().toISOString(),
      cachedAt: new Date().toISOString()
    }
    await storage.set(cacheKey, wrappedData, { ttl })

    const refreshTime = performance.now() - refreshStartTime
    logger.info(`✅ Background refresh completed for ${cacheKey} in ${refreshTime.toFixed(2)}ms`)
  } catch (error: any) {
    const refreshTime = performance.now() - refreshStartTime
    logger.error(`❌ Background refresh failed after ${refreshTime.toFixed(2)}ms:`, error?.message || error)
  }
}
