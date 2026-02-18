/**
 * POST /api/v2/users/verify
 * Complete user verification using a verification code from WordPress
 *
 * This endpoint is called from the Create Studio frontend when a user
 * enters their verification code obtained from the WordPress plugin.
 *
 * The code is stored on the site record (not tied to any specific user).
 * Whoever is logged in and submits the correct code gets linked to the site.
 *
 * Request body:
 * {
 *   verification_code: string - The code from WordPress (format: XXXX-XXXX-XXXX-XXXX)
 * }
 *
 * Requires: Authenticated session (user must be logged in)
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteUserRepository, SiteRepository } from '~~/server/utils/database'
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

    // Find site by pending verification code (try both formats)
    let site = await siteRepo.findByPendingVerificationCode(formattedCode)
    if (!site) {
      site = await siteRepo.findByPendingVerificationCode(verification_code)
    }

    if (!site) {
      logger.debug('No site found with pending verification code', { code: formattedCode })
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'invalid_code',
        message: 'Verification code not found or already used'
      }
    }

    // Create or update SiteUser for the logged-in user
    let siteUser = await siteUserRepo.findByUserAndSite(userId, site.id)

    if (siteUser && siteUser.verified_at) {
      // Already verified — clear the pending code and return success
      await siteRepo.clearPendingVerificationCode(site.id)

      logger.debug('User already verified for this site', { siteId: site.id, userId })
      return {
        success: true,
        site_id: site.id,
        site_name: site.name || new URL(site.url || '').hostname,
        site_url: site.url,
        redirect_url: `/admin?site=${site.id}`
      }
    }

    if (!siteUser) {
      // Create a new SiteUser record
      await siteUserRepo.createPending(userId, site.id, 'owner')
    }

    // Mark as verified and generate user token
    const { token } = await siteUserRepo.markVerifiedWithToken(userId, site.id)

    // Clear the pending verification code from the site
    await siteRepo.clearPendingVerificationCode(site.id)

    logger.info('User verification completed', {
      siteId: site.id,
      userId,
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
