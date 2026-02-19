/**
 * POST /api/v2/auth/link/complete
 * Complete the link session after user authenticates in Studio
 *
 * Requires: Authenticated session (user must be logged in)
 * Body: { session_id: string }
 *
 * Response:
 * - success: { success: true, site_name, site_url, return_url }
 * - error: various error states
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { LinkSessionRepository, SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Auth:Link:Complete', debug)

  try {
    // Require authenticated session
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'unauthorized',
        message: 'You must be logged in to link your account'
      }
    }

    const userId = session.user.id

    // Rate limit: 10 per minute per user
    await rateLimitMiddleware(event, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: 'auth_link_complete:',
      getKey: () => userId.toString(),
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
    const siteRepo = new SiteRepository()
    const siteUserRepo = new SiteUserRepository()

    // Find valid (non-expired) session
    const linkSession = await linkSessionRepo.findValidById(session_id)
    if (!linkSession) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'session_expired',
        message: 'This link session has expired or was not found'
      }
    }

    // Get site
    const site = await siteRepo.findById(linkSession.site_id)
    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'site_not_found',
        message: 'Site not found'
      }
    }

    // Create or find SiteUser
    await siteUserRepo.createPending(userId, site.id, 'owner')

    // Mark as verified and generate user token
    const { token } = await siteUserRepo.markVerifiedWithToken(userId, site.id)

    // Store token on the link session for exchange
    await linkSessionRepo.complete(linkSession.id, userId, token)

    logger.info('Link session completed', {
      siteId: site.id,
      userId,
      sessionId: linkSession.id,
    })

    const siteName = site.name || (() => {
      try { return new URL(site.url || '').hostname } catch { return site.url || 'Unknown' }
    })()

    return {
      success: true,
      site_name: siteName,
      site_url: site.url,
      return_url: linkSession.return_url,
    }
  }
  catch (error: any) {
    logger.error('Error completing link session:', error)
    return sendErrorResponse(event, error)
  }
})
