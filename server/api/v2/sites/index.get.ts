/**
 * GET /api/v2/sites
 * Get all canonical sites the authenticated user has access to
 *
 * Requires authentication (session)
 * Response: { success: boolean, sites: Site[] }
 *
 * V2 API uses canonical sites via SiteUsers pivot table
 */

import { SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

const { debug } = useRuntimeConfig()
const logger = useLogger('API:Sites', debug)

export default defineEventHandler(async (event) => {
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

    // Fetch canonical sites user has access to
    const siteRepo = new SiteRepository()
    const sites = await siteRepo.getUserCanonicalSites(userId)

    logger.debug('Fetched canonical sites for user', userId, sites.length)

    return {
      success: true,
      sites
    }

  } catch (error: any) {
    logger.error('Error fetching sites:', error)
    return sendErrorResponse(event, error)
  }
})
