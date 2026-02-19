/**
 * POST /api/v2/auth/resend-site-user-verification
 * Resend email verification for a user authenticated via site user token.
 *
 * Authorization: Bearer {user_token} (SiteUser.user_token from WordPress)
 *
 * Response codes:
 * - 200 OK: Verification email sent
 * - 400 Bad Request: Email already verified
 * - 401 Unauthorized: Invalid or missing token
 * - 403 Forbidden: User verification not complete
 * - 429 Too Many Requests: Rate limit exceeded
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteUserRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { extractTokenFromHeader } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Auth:ResendSiteUserVerification', debug)

  try {
    // Extract user token from Authorization header
    const authHeader = getHeader(event, 'authorization')
    let userToken: string

    try {
      userToken = extractTokenFromHeader(authHeader)
    }
    catch {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Authorization header missing or invalid',
      }
    }

    const siteUserRepo = new SiteUserRepository()
    const userRepo = new UserRepository()

    // Find SiteUser by token
    const siteUser = await siteUserRepo.findByUserToken(userToken)

    if (!siteUser) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Invalid user token',
      }
    }

    // Verify SiteUser is verified (has verified_at set)
    if (!siteUser.verified_at) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'User verification not complete',
      }
    }

    // Rate limit: 3 per hour per user
    await rateLimitMiddleware(event, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'resend_site_user_verification:',
      getKey: () => `${siteUser.user_id}`,
    })

    // Get user details
    const user = await userRepo.findById(siteUser.user_id)
    if (!user) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'User not found',
      }
    }

    // Check if email is already verified
    if (user.validEmail) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Email is already verified',
      }
    }

    // Generate and send verification email
    const { generateValidationToken } = await import('~~/server/utils/auth')
    const { sendValidationEmail } = await import('~~/server/utils/mailer')

    const validationToken = await generateValidationToken({
      id: user.id,
      email: user.email,
    })

    await sendValidationEmail(user.email, validationToken, {
      firstname: user.firstname,
      lastname: user.lastname,
    })

    logger.info('Resent site-user verification email', {
      userId: user.id,
      siteId: siteUser.site_id,
      email: user.email,
    })

    return {
      success: true,
      message: 'Verification email sent',
    }
  }
  catch (error: any) {
    logger.error('Resend site-user verification error:', error)
    return sendErrorResponse(event, error)
  }
})
