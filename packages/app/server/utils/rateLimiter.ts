/**
 * Simple rate limiter using NuxtHub's KV store
 * For production, consider using a more robust solution
 */

import { useLogger } from '@create-studio/shared/utils/logger'

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

export class RateLimiter {
  private options: RateLimitOptions
  private logger: any

  constructor(options: RateLimitOptions) {
    this.options = {
      keyPrefix: 'rate_limit:',
      ...options
    }
    const config = useRuntimeConfig()
    this.logger = useLogger('RateLimiter', config.debug)
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const fullKey = `${this.options.keyPrefix}${key}`
      const now = Date.now()

      // Get current count from KV
      const kv = hubKV()
      const data = await kv.get<{ count: number; resetAt: number }>(fullKey)

      if (!data) {
        // First request in window
        await kv.set(fullKey, {
          count: 1,
          resetAt: now + this.options.windowMs
        }, {
          ttl: Math.floor(this.options.windowMs / 1000)
        })

        return {
          allowed: true,
          remaining: this.options.maxRequests - 1
        }
      }

      // Window has expired, reset
      if (now > data.resetAt) {
        await kv.set(fullKey, {
          count: 1,
          resetAt: now + this.options.windowMs
        }, {
          ttl: Math.floor(this.options.windowMs / 1000)
        })

        return {
          allowed: true,
          remaining: this.options.maxRequests - 1
        }
      }

      // Check if limit exceeded
      if (data.count >= this.options.maxRequests) {
        this.logger.warn(`Rate limit exceeded for key: ${key}`)
        return {
          allowed: false,
          remaining: 0
        }
      }

      // Increment count
      await kv.set(fullKey, {
        count: data.count + 1,
        resetAt: data.resetAt
      }, {
        ttl: Math.floor((data.resetAt - now) / 1000)
      })

      return {
        allowed: true,
        remaining: this.options.maxRequests - (data.count + 1)
      }
    } catch (error) {
      this.logger.error('Rate limiter error:', error)
      // Fail open on error
      return {
        allowed: true,
        remaining: this.options.maxRequests
      }
    }
  }
}

/**
 * Express-style middleware for rate limiting
 */
export async function rateLimitMiddleware(
  event: any,
  options: RateLimitOptions & { getKey?: (event: any) => string }
) {
  const limiter = new RateLimiter(options)
  const key = options.getKey ? options.getKey(event) : getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  const result = await limiter.checkLimit(key)

  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests, please try again later'
    })
  }

  return result
}
