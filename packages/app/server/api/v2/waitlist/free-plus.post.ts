/**
 * POST /api/v2/waitlist/free-plus
 * Join the Free+ tier waitlist — public endpoint, no auth required.
 *
 * Request body: { email: string, marketing_opt_in?: boolean }
 * Response:     { success: boolean, alreadyOnList: boolean }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:WaitlistFreePlus', debug)

  try {
    // Rate limit: 5 requests per minute per IP
    await rateLimitMiddleware(event, {
      maxRequests: 5,
      windowMs: 60_000,
      keyPrefix: 'waitlist_free_plus:',
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

    const marketing_opt_in = body.marketing_opt_in ?? false
    const now = new Date().toISOString()
    const userRepo = new UserRepository()

    // Check for existing user
    const existingUser = await userRepo.findByEmail(email)

    if (existingUser) {
      const meta = (existingUser.metadata as Record<string, any>) || {}

      // Already on the waitlist
      if (meta.waitlist_free_plus) {
        return { success: true, alreadyOnList: true }
      }

      // Existing user, not yet on waitlist — merge into metadata
      const updates: Record<string, any> = {
        metadata: { ...meta, waitlist_free_plus: now },
      }
      if (marketing_opt_in) {
        updates.marketing_opt_in = true
      }
      await userRepo.update(existingUser.id, updates)

      logger.debug('Existing user joined Free+ waitlist', existingUser.id)
      return { success: true, alreadyOnList: false }
    }

    // No user — create one (no password, waitlist only)
    await userRepo.create({
      email,
      marketing_opt_in,
      metadata: { waitlist_free_plus: now },
    })

    logger.debug('New user created for Free+ waitlist', email)
    return { success: true, alreadyOnList: false }
  }
  catch (error: any) {
    logger.error('Waitlist error:', error)
    return sendErrorResponse(event, error)
  }
})
