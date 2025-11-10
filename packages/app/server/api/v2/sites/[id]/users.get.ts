/**
 * GET /api/v2/sites/:id/users
 * Get list of team members for a site
 *
 * Requires authentication (session)
 * Verifies user has access to the site
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository, SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('GetSiteUsersEndpoint', debug)

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

    // Get the site
    const site = await siteRepo.findById(siteId)
    if (!site) {
      setResponseStatus(event, 404)
      logger.debug('Site not found', siteId)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // V2 API: Verify this is a canonical site
    if (site.canonical_site_id !== null && site.canonical_site_id !== undefined) {
      setResponseStatus(event, 400)
      logger.debug('Not a canonical site', { siteId, canonicalSiteId: site.canonical_site_id })
      return {
        success: false,
        error: 'Invalid site ID - not a canonical site'
      }
    }

    // V2 API: Verify user has access to this site
    const hasAccess = await siteRepo.userHasAccessToSite(userId, siteId)
    if (!hasAccess) {
      setResponseStatus(event, 403)
      logger.debug('User does not have access to site', { userId, siteId })
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    // Get all users for this site
    const siteUsers = await siteRepo.getSiteUsers(siteId)

    // Fetch full user data for each site user
    const userRepo = new UserRepository()
    const users = []

    for (const siteUser of siteUsers) {
      const user = await userRepo.findById(siteUser.userId)
      if (user) {
        users.push({
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          avatar: user.avatar,
          validEmail: user.validEmail,
          role: siteUser.role,
          joinedAt: siteUser.joinedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })
      }
    }

    // Return response with user count
    setResponseStatus(event, 200)
    logger.debug('Site users retrieved successfully', { siteId, userCount: users.length })
    return {
      success: true,
      users,
      pagination: {
        total: users.length,
        page: 1,
        pageSize: users.length
      }
    }
  } catch (error) {
    logger.error('Site users fetch error:', error)
    return sendErrorResponse(event, error)
  }
})
