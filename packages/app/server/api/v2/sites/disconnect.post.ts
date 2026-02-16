/**
 * POST /api/v2/sites/disconnect
 * Disconnect a site from the current user (called from WordPress plugin)
 *
 * Requires JWT authentication (Bearer token from plugin)
 * The site_id is extracted from the JWT token payload.
 * Response: { success: boolean }
 *
 * This endpoint is called by the WordPress plugin when a user disconnects
 * from Create Studio. It clears the verified_at timestamp on the SiteUsers
 * record, returning the connection to an unverified state. This allows the
 * user to easily reconnect later by re-verifying their site ownership.
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyAnyJWT, getTokenType } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Disconnect', debug)

  try {
    // Verify JWT token from plugin - accepts both user and site tokens
    const tokenPayload = await verifyAnyJWT(event)
    const tokenType = getTokenType(tokenPayload)
    const siteId = tokenPayload.site_id

    if (!siteId) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Token does not contain site_id'
      }
    }

    logger.debug('Processing disconnect request', { siteId, tokenType })

    const siteRepo = new SiteRepository()
    const siteUserRepo = new SiteUserRepository()

    // Find site
    const site = await siteRepo.findById(siteId)

    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    if (tokenType === 'site') {
      // Site token: unverify ALL SiteUser records for this site
      await siteUserRepo.unverifyAllForSite(siteId)
      logger.info('Unverified all site connections', { siteId, url: site.url })

      return {
        success: true,
        message: 'Site disconnected successfully'
      }
    }

    // User token: unverify only this user's record (existing behavior)
    const userId = (tokenPayload as { id: number }).id

    if (!userId) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Find user's connection to this site
    const siteUser = await siteUserRepo.findByUserAndSite(userId, siteId)

    if (!siteUser) {
      // No connection exists - this is fine, just return success
      // (might be a retry or the connection was already removed)
      logger.debug('No site-user connection found, returning success', { userId, siteId })
      return {
        success: true,
        message: 'No connection to remove'
      }
    }

    if (!siteUser.verified_at) {
      // Already unverified - just return success
      logger.debug('Site already unverified, returning success', { userId, siteId })
      return {
        success: true,
        message: 'Site already disconnected'
      }
    }

    // Unverify the connection (clear verified_at) instead of deleting
    // This allows the user to easily reconnect later
    await siteUserRepo.unverify(userId, siteId)

    logger.info('Unverified site connection for user', { userId, siteId, url: site.url })

    return {
      success: true,
      message: 'Site disconnected successfully'
    }
  }
  catch (error: any) {
    logger.error('Error disconnecting site:', error)
    return sendErrorResponse(event, error)
  }
})
