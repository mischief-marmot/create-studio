/**
 * GET /api/v2/users/:id
 * Get user information by ID
 *
 * Supports both session and JWT authentication.
 * For JWT: Returns 401 PASSWORD_REQUIRED if user exists but has no password set
 * For session: Allows fetching own user info
 *
 * Query params:
 * - site_url: Optional. When provided (typically from WordPress plugin), returns
 *   site verification status. If site exists but is not verified, includes
 *   site.verified=false in the response so the plugin can show verification UI.
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository, SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'
import { normalizeSiteUrl, parseAllowedTestDomains } from '~~/server/utils/url'
import { getAvatarUrl } from '~~/server/utils/avatar'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('GetUserEndpoint', debug)

  try {
    const userIdParam = parseInt(getRouterParam(event, 'id') || '0')

    if (!userIdParam || userIdParam === 0) {
      setResponseStatus(event, 400)
      logger.debug('Invalid user ID', userIdParam)
      return {
        success: false,
        error: 'Invalid user ID'
      }
    }

    let authenticatedUserId: number | null = null
    let authMethod = 'none'

    // Try session-based authentication first
    try {
      const session = await getUserSession(event)
      if (session?.user?.id) {
        authenticatedUserId = session.user.id
        authMethod = 'session'
      }
    } catch (sessionError) {
      // Session auth failed, try JWT
      logger.debug('Session authentication failed, trying JWT')
    }

    // If no session, try JWT authentication
    if (!authenticatedUserId) {
      try {
        const jwtPayload = await verifyJWT(event)
        authenticatedUserId = jwtPayload.id
        authMethod = 'jwt'
      } catch (jwtError) {
        setResponseStatus(event, 401)
        logger.debug('Authentication failed: no valid session or JWT')
        return {
          success: false,
          error: 'Unauthorized'
        }
      }
    }

    // Get the user
    const userRepo = new UserRepository()
    const user = await userRepo.findById(userIdParam)

    if (!user) {
      setResponseStatus(event, 404)
      logger.debug('User not found', userIdParam)
      return {
        success: false,
        error: 'User not found'
      }
    }

    // For session authentication, user can only see their own info
    if (authMethod === 'session' && authenticatedUserId !== userIdParam) {
      setResponseStatus(event, 403)
      logger.debug('User can only view their own profile', { authenticatedUserId, userIdParam })
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    // For JWT authentication (WordPress plugin), check if password is set
    if (authMethod === 'jwt' && !user.password) {
      setResponseStatus(event, 401)
      logger.debug('User password not set', { userId: userIdParam })
      return {
        success: false,
        error: 'Password required for v2 API',
        code: 'PASSWORD_REQUIRED'
      }
    }

    // Check site verification status if site_url is provided
    let siteInfo: { id: number | null, verified: boolean, url: string } | null = null
    const siteUrlParam = getQuery(event).site_url as string | undefined

    if (siteUrlParam && authMethod === 'jwt') {
      const { allowedTestDomains } = useRuntimeConfig()
      const allowedDomains = parseAllowedTestDomains(allowedTestDomains)
      const normalizedUrl = normalizeSiteUrl(siteUrlParam, { allowedDomains })
      if (normalizedUrl) {
        const siteRepo = new SiteRepository()
        const siteUserRepo = new SiteUserRepository()

        const site = await siteRepo.findCanonicalSite(normalizedUrl)
        if (site) {
          const siteUser = await siteUserRepo.findByUserAndSite(userIdParam, site.id!)
          siteInfo = {
            id: site.id!,
            verified: !!siteUser?.verified_at,
            url: normalizedUrl
          }
          logger.debug('Site verification status', { siteId: site.id, verified: siteInfo.verified })
        } else {
          // Site doesn't exist in Create Studio yet
          siteInfo = {
            id: null,
            verified: false,
            url: normalizedUrl
          }
          logger.debug('Site not found in Create Studio', { url: normalizedUrl })
        }
      }
    }

    // Return user data with password status and optional site verification
    setResponseStatus(event, 200)
    logger.debug('User retrieved successfully', { userId: userIdParam, authMethod })
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.avatar,
        avatarUrl: getAvatarUrl(user.avatar),
        validEmail: user.validEmail,
        mediavine_publisher: user.mediavine_publisher,
        hasPassword: !!user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      // Include site info when site_url was provided
      ...(siteInfo && { site: siteInfo })
    }
  } catch (error) {
    logger.error('User fetch error:', error)
    return sendErrorResponse(event, error)
  }
})
