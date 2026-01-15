/**
 * GET /api/v2/sites/:id/users/verify/status
 * Check user verification status
 *
 * Authorization: Bearer {site_api_token} (JWT)
 * Query params: email
 *
 * Response:
 * - verified: { status: 'verified', user_token, email, verified_at }
 * - pending: { status: 'pending', email }
 * - not_found: { status: 'not_found' }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'
import { getGravatarUrl } from '~/composables/useAvatar'


export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Users:Verify:Status', debug)

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

    // Rate limit: 60 status checks per minute per site (for polling)
    await rateLimitMiddleware(event, {
      maxRequests: 60,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: 'user_verify_status:',
      getKey: () => siteIdParam.toString(),
    })

    // Get email from query params
    const query = getQuery(event)
    const email = query.email as string

    if (!email || typeof email !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Email query parameter is required'
      }
    }

    if (!validateEmail(email)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid email format'
      }
    }

    const siteRepo = new SiteRepository()
    const siteUserRepo = new SiteUserRepository()
    const userRepo = new UserRepository()

    // Find site
    const site = await siteRepo.findById(siteIdParam)
    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'site_not_found',
        message: 'Site not found'
      }
    }

    // Find user by email
    const user = await userRepo.findByEmail(email.toLowerCase())
    if (!user) {
      logger.debug('User not found', { email })
      return {
        status: 'not_found'
      }
    }

    // Find SiteUser record
    const siteUser = await siteUserRepo.findByUserAndSite(user.id, siteIdParam)
    if (!siteUser) {
      logger.debug('SiteUser not found', { siteId: siteIdParam, userId: user.id })
      return {
        status: 'not_found'
      }
    }

    // Check verification status
    if (siteUser.verified_at) {
      let userToken = siteUser.user_token

      // If user was verified before user tokens were implemented, generate one now
      if (!userToken) {
        logger.debug('Generating token for legacy verified user', { siteId: siteIdParam, email })
        userToken = await siteUserRepo.generateUserToken(user.id, siteIdParam)
      }

      logger.debug('User is verified', { siteId: siteIdParam, email })
      // Use Gravatar URL for the avatar (the composable can't be used in server routes)
      const avatarUrl = getGravatarUrl(user.email)
      return {
        status: 'verified',
        user_token: userToken,
        email: user.email,
        avatarUrl,
        verified_at: siteUser.verified_at
      }
    }

    // Pending verification
    logger.debug('User verification pending', { siteId: siteIdParam, email })
    return {
      status: 'pending',
      email: user.email
    }
  }
  catch (error: any) {
    logger.error('Error checking verification status:', error)
    return sendErrorResponse(event, error)
  }
})
