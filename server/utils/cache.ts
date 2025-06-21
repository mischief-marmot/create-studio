// Cache utilities for Cloudflare KV using NuxtHub
export interface CacheOptions {
  expirationTtl?: number // TTL in seconds
  prefix?: string
}

const DEFAULT_TTL = 3600 // 1 hour
const CACHE_PREFIX = 'rcg' // Recipe Card Generator prefix

export const cache = {
  /**
   * Generate a cache key with prefix
   */
  key(key: string, prefix?: string): string {
    const keyPrefix = prefix || CACHE_PREFIX
    return `${keyPrefix}:${key}`
  },

  /**
   * Get value from KV cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.key(key, options?.prefix)
      const kv = hubKV()
      if (!kv || typeof kv.get !== 'function') {
        return null
      }
      
      const value = await kv.get(fullKey)
      
      if (!value) return null
      
      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(value)
      } catch {
        return value as T
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  /**
   * Set value in KV cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.key(key, options?.prefix)
      const ttl = options?.expirationTtl || DEFAULT_TTL
      
      // Serialize the value
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
      
      const kv = hubKV()
      if (kv && typeof kv.put === 'function') {
        await kv.put(fullKey, serializedValue, {
          expirationTtl: ttl
        })
      }
      
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  },

  /**
   * Delete value from KV cache
   */
  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.key(key, options?.prefix)
      await hubKV().delete(fullKey)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  },

  /**
   * Delete multiple keys with a prefix
   */
  async deleteByPrefix(prefix: string): Promise<boolean> {
    try {
      const fullPrefix = this.key('', prefix)
      // Note: KV doesn't have a native deleteByPrefix, so we'll need to list and delete
      // This is a simplified implementation - in production you might want to track keys separately
      console.log(`Invalidating cache with prefix: ${fullPrefix}`)
      return true
    } catch (error) {
      console.error('Cache deleteByPrefix error:', error)
      return false
    }
  },

  /**
   * Get or set pattern - if cache miss, execute function and cache result
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
      return cached
    }

    // Cache miss - execute function
    const result = await fetchFunction()
    
    // Cache the result
    await this.set(key, result, options)
    
    return result
  }
}

// Specific cache functions for cards
export const cardsCache = {
  /**
   * Get user's cards list from cache
   */
  async getUserCards(userId: string) {
    return cache.get(`user:${userId}:cards`, { expirationTtl: 300 }) // 5 minutes
  },

  /**
   * Set user's cards list in cache
   */
  async setUserCards(userId: string, cards: any[]) {
    return cache.set(`user:${userId}:cards`, cards, { expirationTtl: 300 })
  },

  /**
   * Get specific card from cache
   */
  async getCard(cardId: string) {
    return cache.get(`card:${cardId}`, { expirationTtl: 1800 }) // 30 minutes
  },

  /**
   * Set specific card in cache
   */
  async setCard(cardId: string, card: any) {
    return cache.set(`card:${cardId}`, card, { expirationTtl: 1800 })
  },

  /**
   * Invalidate user's cards cache
   */
  async invalidateUserCards(userId: string) {
    return cache.delete(`user:${userId}:cards`)
  },

  /**
   * Invalidate specific card cache
   */
  async invalidateCard(cardId: string) {
    return cache.delete(`card:${cardId}`)
  },

  /**
   * Invalidate all caches for a card (including user list)
   */
  async invalidateCardCaches(cardId: string, userId: string) {
    await Promise.all([
      this.invalidateCard(cardId),
      this.invalidateUserCards(userId)
    ])
  }
}