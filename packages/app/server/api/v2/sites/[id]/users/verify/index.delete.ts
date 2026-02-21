/**
 * DELETE /api/v2/sites/:id/users/verify
 * Disconnect user verification
 *
 * Authorization: Bearer {user_token} (not JWT, this is the SiteUser.user_token)
 *
 * Clears the verification for the SiteUser record:
 * - Sets verified_at to null
 * - Clears verification_code
 * - Clears user_token
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { extractTokenFromHeader } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Users:Verify:Disconnect', debug)

  try {
    // Get site ID from route params
    const siteIdParam = parseInt(getRouterParam(event, 'id') || '', 10)

    if (isNaN(siteIdParam)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

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
        error: 'Authorization header missing or invalid'
      }
    }

    const siteUserRepo = new SiteUserRepository()
    const siteRepo = new SiteRepository()

    // Find site first
    const site = await siteRepo.findById(siteIdParam)
    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // Find SiteUser by token
    const siteUser = await siteUserRepo.findByUserToken(userToken)

    if (!siteUser) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Invalid user token'
      }
    }

    // Verify the token belongs to this site
    if (siteUser.site_id !== siteIdParam) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Token not authorized for this site'
      }
    }

    // Rate limit: 10 disconnect requests per hour per user
    await rateLimitMiddleware(event, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'user_verify_disconnect:',
      getKey: () => `${siteUser.site_id}_${siteUser.user_id}`,
    })

    // Clear the verification
    await siteUserRepo.clearVerification(siteUser.user_id, siteIdParam)

    logger.info('User verification disconnected', {
      siteId: siteIdParam,
      userId: siteUser.user_id
    })

    return {
      success: true
    }
  }
  catch (error: any) {
    logger.error('Error disconnecting user verification:', error)
    return sendErrorResponse(event, error)
  }
})
