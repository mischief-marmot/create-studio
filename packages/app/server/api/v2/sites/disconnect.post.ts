/**
 * POST /api/v2/sites/disconnect
 * Disconnect a site from the current user (called from WordPress plugin)
 *
 * Requires JWT authentication (Bearer token from plugin)
 * The site_id is extracted from the JWT token payload.
 * Response: { success: boolean }
 *
 * This endpoint is called by the WordPress plugin when a user disconnects
 * from Create Studio. It removes the SiteUsers record for that user-site
 * combination but does NOT delete the Site record itself.
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Disconnect', debug)

  try {
    // Verify JWT token from plugin - contains both user_id and site_id
    const tokenPayload = await verifyJWT(event)
    const userId = tokenPayload.id
    const siteId = tokenPayload.site_id

    if (!userId) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    if (!siteId) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Token does not contain site_id'
      }
    }

    logger.debug('Processing disconnect request', { userId, siteId })

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

    // Delete the connection
    await siteUserRepo.delete(userId, siteId)

    logger.info('Disconnected site from user', { userId, siteId, url: site.url })

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
