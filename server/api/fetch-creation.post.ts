import { transformCreationToHowTo } from '../utils/creationTransformer'
import type { HowTo } from '~/types/schema-org'

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
  
  // Check cache if not busting
  if (!cache_bust) {
    try {
      const cached = await storage.get<HowTo>(cacheKey)
      if (cached) {
        console.log(`Cache hit for ${cacheKey}`)
        return cached
      }
    } catch (error) {
      console.error('Cache read error:', error)
    }
  } else {
    console.log(`Cache bust requested for ${cacheKey}`)
  }
  
  // Fetch fresh data from WordPress API
  const url = `${site_url}/wp-json/mv-create/v1/creations/${creation_id}`
  
  try {
    console.log(`Fetching creation from ${url}`)
    const response = await $fetch<WPCreationResponse>(url)
    
    // Transform the response to HowTo format
    const transformedData = await transformCreationToHowTo(response, site_url)
    
    // Cache the transformed data
    try {
      await storage.set(cacheKey, transformedData, { ttl: TTL })
      console.log(`Cached data for ${cacheKey} with ${TTL}s TTL`)
    } catch (error) {
      console.error('Cache write error:', error)
    }
    
    return transformedData
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: `Failed to fetch creation data: ${error?.message || 'Unknown error'}`
    })
  }
})