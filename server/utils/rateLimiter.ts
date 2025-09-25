const config = useRuntimeConfig()
const logger = useLogger('RateLimiter', config.debug)

/**
 * Simple rate limiter using NuxtHub's KV store
 * For production, consider using a more robust solution
 */

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

export class RateLimiter {
  private options: RateLimitOptions

  constructor(options: RateLimitOptions) {
    this.options = {
      maxRequests: options.maxRequests || 15,
      windowMs: options.windowMs || 5 * 60 * 1000, // 5 minutes default
      keyPrefix: options.keyPrefix || 'rate-limit'
    }
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const kv = hubKV()
      const fullKey = `${this.options.keyPrefix}:${key}`

      // Get current count and timestamp
      const record = await kv.get<{ count: number; resetAt: number }>(fullKey)
      const now = Date.now()

      if (!record || now > record.resetAt) {
        // No record or window expired, reset counter
        const resetAt = now + this.options.windowMs
        await kv.set(fullKey, { count: 1, resetAt }, {
          expirationTtl: Math.ceil(this.options.windowMs / 1000) // TTL in seconds
        })
        return { allowed: true, remaining: this.options.maxRequests - 1 }
      }

      if (record.count >= this.options.maxRequests) {
        // Rate limit exceeded
        return { allowed: false, remaining: 0 }
      }

      // Increment counter
      const newCount = record.count + 1
      await kv.set(fullKey, { count: newCount, resetAt: record.resetAt }, {
        expirationTtl: Math.ceil((record.resetAt - now) / 1000)
      })

      return { allowed: true, remaining: this.options.maxRequests - newCount }
    } catch (error) {
      // In development, KV might not be available - allow requests
      if (process.env.NODE_ENV === 'development') {
        logger.warn('KV store not available in development')
        return { allowed: true, remaining: this.options.maxRequests }
      }
      logger.error('Something went wrong', error)
      throw error
    }
  }
}

/**
 * Middleware for rate limiting specific endpoints
 */
export async function rateLimitMiddleware(
  event: any,
  options: RateLimitOptions & { getKey: (event: any) => string }
): Promise<void> {
  const limiter = new RateLimiter(options)
  const key = options.getKey(event)

  const { allowed, remaining } = await limiter.checkLimit(key)

  // Set rate limit headers
  setHeader(event, 'X-RateLimit-Limit', options.maxRequests.toString())
  setHeader(event, 'X-RateLimit-Remaining', remaining.toString())

  if (!allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests'
    })
  }
}

/**
 * Create a rate limiter for nutrition endpoint (15 requests per 5 minutes per user)
 */
export function createNutritionRateLimiter() {
  return new RateLimiter({
    maxRequests: 15,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'nutrition'
  })
}