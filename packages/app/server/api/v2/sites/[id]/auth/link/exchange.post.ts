/**
 * POST /api/v2/sites/:id/auth/link/exchange
 * Exchange a completed link session for user token and profile data
 *
 * Authorization: Bearer {site_api_token} (JWT)
 * Body: { session_id: string }
 *
 * Response:
 * - success: { user_token, email, avatarUrl, verified_at, email_verified }
 * - error: various error states
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { LinkSessionRepository, SiteRepository, SiteUserRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'
import { getGravatarUrl } from '~/composables/useAvatar'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Auth:Link:Exchange', debug)

  try {
    // Verify JWT token (site API token)
    const jwtPayload = await verifyJWT(event)
    const siteIdFromToken = jwtPayload.site_id

    // Get site ID from route params
    const siteIdParam = parseInt(getRouterParam(event, 'id') || '', 10)

    if (isNaN(siteIdParam)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

    // Verify the token is for this site
    if (siteIdFromToken && siteIdFromToken !== siteIdParam) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Token not authorized for this site'
      }
    }

    // Rate limit: 30 per hour per site
    await rateLimitMiddleware(event, {
      maxRequests: 30,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'auth_link_exchange:',
      getKey: () => siteIdParam.toString(),
    })

    // Parse request body
    const body = await readBody(event)
    const { session_id } = body

    if (!session_id || typeof session_id !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'invalid_request',
        message: 'session_id is required'
      }
    }

    const linkSessionRepo = new LinkSessionRepository()
    const userRepo = new UserRepository()
    const siteUserRepo = new SiteUserRepository()

    // Find session (don't need to check expiry — exchange can happen after expiry as long as it's completed)
    const linkSession = await linkSessionRepo.findById(session_id)

    if (!linkSession) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'session_not_found',
        message: 'Link session not found'
      }
    }

    // Validate session belongs to this site
    if (linkSession.site_id !== siteIdParam) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'session_mismatch',
        message: 'Session does not belong to this site'
      }
    }

    // Validate session has been completed (has user_token)
    if (!linkSession.user_token || !linkSession.user_id) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'session_not_completed',
        message: 'Link session has not been completed yet'
      }
    }

    // Get user data
    const user = await userRepo.findById(linkSession.user_id)
    if (!user) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'user_not_found',
        message: 'User not found'
      }
    }

    // Get verified SiteUser for verified_at timestamp
    const siteUser = await siteUserRepo.findByUserAndSite(linkSession.user_id, siteIdParam)

    const avatarUrl = getGravatarUrl(user.email)

    // Delete session (one-time use)
    await linkSessionRepo.delete(linkSession.id)

    logger.info('Link session exchanged', {
      siteId: siteIdParam,
      userId: linkSession.user_id,
      sessionId: session_id,
    })

    return {
      user_token: linkSession.user_token,
      email: user.email,
      avatarUrl,
      verified_at: siteUser?.verified_at || null,
      email_verified: Boolean(user.validEmail),
    }
  }
  catch (error: any) {
    logger.error('Error exchanging link session:', error)
    return sendErrorResponse(event, error)
  }
})
