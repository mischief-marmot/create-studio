/**
 * POST /api/v2/releases/subscribe
 * Subscribe to release notes — public endpoint, no auth required.
 *
 * Request body: { email: string, marketing_opt_in?: boolean, products?: ('create-plugin' | 'create-studio')[] }
 * Response:     { success: boolean, alreadySubscribed: boolean }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

const VALID_PRODUCTS = ['create-plugin', 'create-studio']

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:ReleaseSubscribe', debug)

  try {
    // Rate limit: 5 requests per minute per IP
    await rateLimitMiddleware(event, {
      maxRequests: 5,
      windowMs: 60_000,
      keyPrefix: 'release_subscribe:',
    })

    const body = await readBody(event)
    const rawEmail = body?.email

    // Validate email
    if (!rawEmail || typeof rawEmail !== 'string') {
      setResponseStatus(event, 400)
      return { success: false, error: 'Email is required' }
    }

    const email = rawEmail.trim().toLowerCase()

    if (!validateEmail(email)) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Valid email is required' }
    }

    // Validate products
    const products = Array.isArray(body.products)
      ? body.products.filter((p: string) => VALID_PRODUCTS.includes(p))
      : VALID_PRODUCTS

    const marketing_opt_in = body.marketing_opt_in ?? false
    const now = new Date().toISOString()
    const userRepo = new UserRepository()

    // Check for existing user
    const existingUser = await userRepo.findByEmail(email)

    if (existingUser) {
      const meta = (existingUser.metadata as Record<string, any>) || {}

      // Already subscribed
      if (meta.subscribed_releases) {
        return { success: true, alreadySubscribed: true }
      }

      // Existing user, not yet subscribed — merge into metadata
      const updates: Record<string, any> = {
        metadata: {
          ...meta,
          subscribed_releases: now,
          subscribed_releases_products: products,
        },
      }
      if (marketing_opt_in) {
        updates.marketing_opt_in = true
      }
      await userRepo.update(existingUser.id, updates)

      logger.debug('Existing user subscribed to releases', existingUser.id)
      return { success: true, alreadySubscribed: false }
    }

    // No user — create one (no password, subscription only)
    await userRepo.create({
      email,
      marketing_opt_in,
      metadata: {
        subscribed_releases: now,
        subscribed_releases_products: products,
      },
    })

    logger.debug('New user created for release subscription', email)
    return { success: true, alreadySubscribed: false }
  }
  catch (error: any) {
    logger.error('Release subscribe error:', error)
    return sendErrorResponse(event, error)
  }
})
