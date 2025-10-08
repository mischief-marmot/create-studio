/**
 * POST /api/v2/users/change-password
 * Change user password
 *
 * Requires authentication (session)
 * Request body: { currentPassword: string, newPassword: string }
 */

import { UserRepository } from '~~/server/utils/database'
import { verifyUserPassword, hashUserPassword } from '~~/server/utils/auth'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const {debug} = useRuntimeConfig()
  const logger = useLogger('ChangePasswordEndpoint', debug)
  try {
    // Require user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Read body
    const body = await readBody(event)
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword) {
      setResponseStatus(event, 400)
      logger.debug('Current password is required')
      return {
        success: false,
        error: 'Current password is required'
      }
    }

    if (!newPassword || newPassword.length < 8) {
      setResponseStatus(event, 400)
      logger.debug('New password must be at least 8 characters')
      return {
        success: false,
        error: 'New password must be at least 8 characters'
      }
    }

    const userRepo = new UserRepository()

    // Get user with password
    const user = await userRepo.findById(userId)
    if (!user || !user.password) {
      setResponseStatus(event, 404)
      logger.debug('User not found or has no password')
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyUserPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      setResponseStatus(event, 401)
      logger.debug('Current password is incorrect')
      return {
        success: false,
        error: 'Current password is incorrect'
      }
    }

    // Hash new password
    const newPasswordHash = await hashUserPassword(newPassword)

    // Update password
    await userRepo.setPassword(userId, newPasswordHash)

    logger.debug('Password changed successfully for user', userId)

    // Return response
    setResponseStatus(event, 200)
    return {
      success: true
    }

  } catch (error) {
    logger.error('Password change error:', error)
    return sendErrorResponse(event, error)
  }
})
