/**
 * GET /api/v2/sites/:id
 * Get site information
 *
 * Requires authentication (session)
 * Verifies user owns the site
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const {debug} = useRuntimeConfig()
  const logger = useLogger('GetSiteEndpoint', debug)
  try {
    // Require user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    const siteId = parseInt(getRouterParam(event, 'id') || '0')

    if (!siteId || siteId === 0) {
      setResponseStatus(event, 400)
      logger.debug('Invalid site ID', siteId)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

    const siteRepo = new SiteRepository()

    // Get existing site
    const existingSite = await siteRepo.findById(siteId)
    if (!existingSite) {
      setResponseStatus(event, 404)
      logger.debug('Site not found', existingSite)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // V2 API: Verify this is a canonical site
    if (existingSite.canonical_site_id !== null && existingSite.canonical_site_id !== undefined) {
      setResponseStatus(event, 400)
      logger.debug('Not a canonical site', { siteId, canonicalSiteId: existingSite.canonical_site_id })
      return {
        success: false,
        error: 'Invalid site ID - not a canonical site'
      }
    }

    // V2 API: Verify user has access via SiteUsers
    const hasAccess = await siteRepo.userHasAccessToSite(userId, siteId)
    if (!hasAccess) {
      setResponseStatus(event, 403)
      logger.debug('User does not have access to site', { userId, siteId })
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    // Return response
    setResponseStatus(event, 200)
    return {
      success: true,
      site: existingSite
    }

  } catch (error) {
    logger.error('Site fetch error:', error)
    return sendErrorResponse(event, error)
  }
})