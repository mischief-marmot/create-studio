/**
 * GET /api/v2/sites
 * Get all canonical sites the authenticated user has access to
 *
 * Requires authentication (session)
 * Response: { success: boolean, sites: SiteWithStatus[] }
 *
 * V2 API uses canonical sites via SiteUsers pivot table
 * Each site includes verification status (pending if verified_at is null)
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository, type Site } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

interface SiteWithStatus extends Site {
  verified_at: string | null
  pending: boolean
  role: string
}

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites', debug)

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
    const siteUserRepo = new SiteUserRepository()

    const sites = await siteRepo.getUserCanonicalSites(userId)
    const siteConnections = await siteUserRepo.getUserConnections(userId)

    // Create a map of site_id to connection info
    const connectionMap = new Map(
      siteConnections.map(conn => [conn.site_id, conn])
    )

    // Add verification status to each site
    const sitesWithStatus: SiteWithStatus[] = sites.map(site => {
      const connection = connectionMap.get(site.id!)
      return {
        ...site,
        verified_at: connection?.verified_at || null,
        pending: !connection?.verified_at,
        role: connection?.role || 'admin'
      }
    })

    logger.debug('Fetched canonical sites for user', userId, sitesWithStatus.length)

    return {
      success: true,
      sites: sitesWithStatus
    }

  }
  catch (error: any) {
    logger.error('Error fetching sites:', error)
    return sendErrorResponse(event, error)
  }
})
