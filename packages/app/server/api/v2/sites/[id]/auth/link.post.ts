/**
 * POST /api/v2/sites/:id/auth/link
 * Create a link session for user verification redirect flow
 *
 * Authorization: Bearer {site_api_token} (JWT)
 * Body: { return_url: string }
 *
 * Response:
 * - already_verified: { status: 'already_verified' }
 * - created: { link_url: string, session_id: string }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, LinkSessionRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug, public: { rootUrl } } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Auth:Link', debug)

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
      keyPrefix: 'auth_link_create:',
      getKey: () => siteIdParam.toString(),
    })

    // Parse request body
    const body = await readBody(event)
    const { return_url } = body

    if (!return_url || typeof return_url !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'return_url is required'
      }
    }

    const siteRepo = new SiteRepository()

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

    // Create link session (allow re-linking even if a verified SiteUser exists,
    // since the WP-side disconnect may have cleared local meta without reaching Studio)
    const linkSessionRepo = new LinkSessionRepository()
    const session = await linkSessionRepo.create(siteIdParam, return_url)

    if (!session) {
      throw new Error('Failed to create link session')
    }

    logger.info('Created link session', { siteId: siteIdParam, sessionId: session.id })

    return {
      success: true,
      link_url: `${rootUrl}/auth/link?session=${session.id}`,
      session_id: session.id,
    }
  }
  catch (error: any) {
    logger.error('Error creating link session:', error)
    return sendErrorResponse(event, error)
  }
})
