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
}

export default defineEventHandler(async (event) => {
  const logger = useLogger('FetchCreation')

  const body = await readBody<FetchCreationBody>(event)

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
  const TTL = 24 * 60 * 60 // 24 hours in seconds
  const isDev = process.env.NODE_ENV === 'development' || import.meta.dev
  
  // Check cache if not busting and not in dev mode
  if (!cache_bust && !isDev) {
    try {
      const cached = await storage.get<HowTo>(cacheKey)
      if (cached) {
        logger.debug(`Cache hit for ${cacheKey}`)
        return cached
      }
    } catch (error) {
      logger.error('Cache read error:', error)
    }
  } else if (cache_bust) {
    logger.debug(`Cache bust requested for ${cacheKey}`)
  } else if (isDev) {
    logger.debug(`Skipping cache in development mode`)
  }
  
  // Fetch fresh data from WordPress API
  const url = `${site_url}/wp-json/mv-create/v1/creations/${creation_id}`
  
  try {
    logger.debug(`Fetching creation from ${url}`)
    const response = await $fetch<WPCreationResponse>(url)
    
    // Transform the response to HowTo format
    const transformedData = await transformCreationToHowTo(response, site_url)
    
    // Cache the transformed data (skip in dev mode)
    if (!isDev) {
      try {
        await storage.set(cacheKey, transformedData, { ttl: TTL })
        logger.debug(`Cached data for ${cacheKey} with ${TTL}s TTL`)
      } catch (error) {
        logger.error('Cache write error:', error)
      }
    }
    
    return transformedData
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: `Failed to fetch creation data: ${error?.message || 'Unknown error'}`
    })
  }
})