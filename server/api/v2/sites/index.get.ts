/**
 * GET /api/v2/sites
 * Get all sites for the authenticated user
 *
 * Requires authentication (session)
 * Response: { success: boolean, sites: Site[] }
 */

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

    // Fetch user's sites
    const sites = await hubDatabase()
      .prepare('SELECT id, url, user_id, create_version, wp_version, php_version, createdAt, updatedAt FROM Sites WHERE user_id = ?')
      .bind(userId)
      .all()

    logger.debug('Fetched sites for user', userId, sites.results?.length || 0)

    return {
      success: true,
      sites: sites.results || []
    }

  } catch (error: any) {
    logger.error('Error fetching sites:', error)
    return sendErrorResponse(event, error)
  }
})
