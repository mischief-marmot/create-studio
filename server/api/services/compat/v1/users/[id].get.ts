/**
 * GET /api/services/compat/v1/users/:id
 * Get user by ID (authenticated, self only)
 *
 * Maintains compatibility with original Express API
 */

import { UserRepository } from '~~/server/utils/database'
import { verifyJWT } from '~~/server/utils/auth'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('GetUserEndpoint', debug)
  try {
    // Verify JWT token
    const user = await verifyJWT(event)
    const requestedUserId = parseInt(getRouterParam(event, 'id') || '0')

    // Check authorization - users can only access their own data
    if (requestedUserId !== user.id) {
      logger.debug('Not authorized', user)
      setResponseStatus(event, 401)
      return {
        error: 'You are not authorized to access this data.'
      }
    }

    const userRepo = new UserRepository()

    // Get user with associated sites
    const userData = await userRepo.findByIdWithSites(requestedUserId)
    logger.debug('userData', userData)

    if (!userData) {
      logger.debug('No user data', userData)
      setResponseStatus(event, 404)
      return {
        error: 'This is weird, but your user information was not found'
      }
    }

    // Return in original format
    setResponseStatus(event, 200)
    return {
      data: userData
    }

  } catch (error) {
    logger.error('User lookup error:', error)
    return sendErrorResponse(event, error)
  }
})