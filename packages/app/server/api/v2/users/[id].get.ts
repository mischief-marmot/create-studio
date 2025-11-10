/**
 * GET /api/v2/users/:id
 * Get user information by ID
 *
 * Supports both session and JWT authentication.
 * For JWT: Returns 401 PASSWORD_REQUIRED if user exists but has no password set
 * For session: Allows fetching own user info
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'

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

    // Return user data with password status
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
        validEmail: user.validEmail,
        mediavine_publisher: user.mediavine_publisher,
        hasPassword: !!user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  } catch (error) {
    logger.error('User fetch error:', error)
    return sendErrorResponse(event, error)
  }
})
