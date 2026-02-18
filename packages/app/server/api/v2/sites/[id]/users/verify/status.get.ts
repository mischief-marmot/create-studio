/**
 * GET /api/v2/sites/:id/users/verify/status
 * Check user verification status
 *
 * Authorization: Bearer {site_api_token} (JWT)
 * Query params: code (the pending verification code)
 *
 * Response:
 * - verified: { status: 'verified', user_token, email, avatarUrl, verified_at }
 * - pending: { status: 'pending' }
 * - not_found: { status: 'not_found' }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'
import { getGravatarUrl } from '~/composables/useAvatar'
import { and, eq, isNotNull } from 'drizzle-orm'

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

    // Get verification code from query params
    const query = getQuery(event)
    const code = query.code as string

    if (!code || typeof code !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Code query parameter is required'
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

    // Check if the site's pending code matches — means still waiting for verification
    if (site.pending_verification_code === code) {
      logger.debug('Verification still pending', { siteId: siteIdParam })
      return {
        status: 'pending',
      }
    }

    // The pending code no longer matches. Two possibilities:
    // 1. Verification completed — pending_verification_code was cleared (set to null)
    // 2. A different code was set (new verification flow started)
    // Only return verified data if the pending code was cleared (null),
    // meaning THIS code's verification flow completed successfully.
    if (site.pending_verification_code !== null) {
      // A different pending code exists — this code is stale
      logger.debug('Code does not match current pending code', { siteId: siteIdParam })
      return {
        status: 'not_found'
      }
    }

    // pending_verification_code is null — check if a verified SiteUser exists
    const verifiedSiteUser = await db.select().from(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.site_id, siteIdParam),
        isNotNull(schema.siteUsers.verified_at)
      ))
      .limit(1)
      .get()

    if (verifiedSiteUser) {
      let userToken = verifiedSiteUser.user_token

      // If user was verified before user tokens were implemented, generate one now
      if (!userToken) {
        logger.debug('Generating token for legacy verified user', { siteId: siteIdParam })
        userToken = await siteUserRepo.generateUserToken(verifiedSiteUser.user_id, siteIdParam)
      }

      // Get the user's email for the response
      const user = await userRepo.findById(verifiedSiteUser.user_id)
      if (!user) {
        logger.error('Verified user not found', { userId: verifiedSiteUser.user_id })
        return { status: 'not_found' }
      }

      logger.debug('User is verified', { siteId: siteIdParam, email: user.email })
      const avatarUrl = getGravatarUrl(user.email)
      return {
        status: 'verified',
        user_token: userToken,
        email: user.email,
        avatarUrl,
        verified_at: verifiedSiteUser.verified_at
      }
    }

    // No verified user found
    logger.debug('Verification not found', { siteId: siteIdParam })
    return {
      status: 'not_found'
    }
  }
  catch (error: any) {
    logger.error('Error checking verification status:', error)
    return sendErrorResponse(event, error)
  }
})
