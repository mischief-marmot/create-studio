/**
 * DELETE /api/v2/sites/:id
 * Remove user's connection to a site
 *
 * Requires authentication (session)
 * Response: { success: boolean }
 *
 * Note: This removes the user's SiteUsers record but does NOT delete
 * the canonical Site record (other users may have access to it).
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Delete', debug)

  try {
    // Get user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    if (!userId) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Get site ID from route params
    const siteId = parseInt(getRouterParam(event, 'id') || '', 10)

    if (isNaN(siteId)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

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
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'You are not connected to this site'
      }
    }

    // Delete the connection
    await siteUserRepo.delete(userId, siteId)

    logger.info('Removed site connection', { userId, siteId, url: site.url })

    return {
      success: true
    }
  }
  catch (error: any) {
    logger.error('Error deleting site connection:', error)
    return sendErrorResponse(event, error)
  }
})
