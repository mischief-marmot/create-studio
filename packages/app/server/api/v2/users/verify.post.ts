/**
 * POST /api/v2/users/verify
 * Complete user verification using a verification code from WordPress
 *
 * This endpoint is called from the Create Studio frontend when a user
 * enters their verification code obtained from the WordPress plugin.
 *
 * Request body:
 * {
 *   verification_code: string - The code from WordPress (format: XXXX-XXXX-XXXX-XXXX)
 * }
 *
 * Response (200):
 * {
 *   success: true,
 *   site_name: string,
 *   site_url: string,
 *   redirect_url: string - URL to redirect user to site dashboard
 * }
 *
 * Response (404):
 * {
 *   error: "invalid_code",
 *   message: "Verification code not found or already used"
 * }
 *
 * Requires: Authenticated session (user must be logged in)
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteUserRepository, SiteRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Users:Verify', debug)

  try {
    // Require authenticated session
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'unauthorized',
        message: 'You must be logged in to verify your account'
      }
    }

    const userId = session.user.id

    // Rate limit: 10 verify attempts per minute per user
    await rateLimitMiddleware(event, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: 'user_verify_code:',
      getKey: () => userId.toString(),
    })

    // Parse request body
    const body = await readBody(event)
    let { verification_code } = body

    if (!verification_code || typeof verification_code !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'invalid_request',
        message: 'Verification code is required'
      }
    }

    // Normalize code - remove dashes and spaces, convert to uppercase
    verification_code = verification_code.replace(/[-\s]/g, '').toUpperCase()

    // Validate code format (should be 16 alphanumeric characters after normalization)
    if (!/^[A-Z0-9]{16}$/.test(verification_code)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'invalid_format',
        message: 'Invalid verification code format'
      }
    }

    // Re-format with dashes for database lookup (stored as XXXX-XXXX-XXXX-XXXX)
    const formattedCode = `${verification_code.slice(0, 4)}-${verification_code.slice(4, 8)}-${verification_code.slice(8, 12)}-${verification_code.slice(12, 16)}`

    const siteUserRepo = new SiteUserRepository()
    const siteRepo = new SiteRepository()
    const userRepo = new UserRepository()

    // Find SiteUser by verification code
    // First try with formatted dashes
    let siteUser = await siteUserRepo.findByVerificationCode(formattedCode)

    // If not found, try without dashes (in case it was stored differently)
    if (!siteUser) {
      siteUser = await siteUserRepo.findByVerificationCode(verification_code)
    }

    if (!siteUser) {
      logger.debug('Verification code not found', { code: formattedCode })
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'invalid_code',
        message: 'Verification code not found or already used'
      }
    }

    // Check if already verified
    if (siteUser.verified_at) {
      logger.debug('SiteUser already verified', { siteId: siteUser.site_id, userId: siteUser.user_id })
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'already_verified',
        message: 'This verification code has already been used'
      }
    }

    // Verify the SiteUser record is for the logged-in user
    // The verification code should be associated with the user making the request
    if (siteUser.user_id !== userId) {
      // Check if the user's email matches - if so, we can link them
      const sessionUser = await userRepo.findById(userId)
      const siteOwnerUser = await userRepo.findById(siteUser.user_id)

      if (!sessionUser || !siteOwnerUser || sessionUser.email.toLowerCase() !== siteOwnerUser.email.toLowerCase()) {
        logger.warn('Verification code belongs to different user', {
          codeUserId: siteUser.user_id,
          sessionUserId: userId
        })
        setResponseStatus(event, 403)
        return {
          success: false,
          error: 'wrong_user',
          message: 'This verification code is for a different account. Please log in with the correct account.'
        }
      }

      // Same email, different user IDs - use the site user ID
      logger.debug('Email match found, proceeding with original user', {
        siteUserId: siteUser.user_id,
        sessionUserId: userId
      })
    }

    // Get site details
    const site = await siteRepo.findById(siteUser.site_id)
    if (!site) {
      logger.error('Site not found for verification', { siteId: siteUser.site_id })
      setResponseStatus(event, 500)
      return {
        success: false,
        error: 'site_not_found',
        message: 'Associated site not found'
      }
    }

    // Mark as verified and generate user token
    const { token } = await siteUserRepo.markVerifiedWithToken(siteUser.user_id, siteUser.site_id)

    logger.info('User verification completed', {
      siteId: site.id,
      userId: siteUser.user_id,
      siteName: site.name || site.url
    })

    return {
      success: true,
      site_id: site.id,
      site_name: site.name || new URL(site.url || '').hostname,
      site_url: site.url,
      redirect_url: `/admin?site=${site.id}`
    }
  }
  catch (error: any) {
    logger.error('Error during user verification:', error)
    return sendErrorResponse(event, error)
  }
})
