/**
 * POST /api/v1/auth/reset-password
 * Reset password using token
 *
 * Request body: { token: string, password: string }
 * Response: { success: boolean, error?: string }
 */

import { UserRepository } from '~~/server/utils/database'
import { verifyPasswordResetToken, hashUserPassword } from '~~/server/utils/auth'
import { sendErrorResponse } from '~~/server/utils/errors'

const { debug } = useRuntimeConfig()
const logger = useLogger('API:ResetPassword', debug)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { token, password } = body

    if (!token) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Reset token is required'
      }
    }

    if (!password || password.length < 8) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Password must be at least 8 characters long'
      }
    }

    // Verify token
    let decoded
    try {
      decoded = await verifyPasswordResetToken(token)
    } catch (error: any) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid or expired reset token'
      }
    }

    const userRepo = new UserRepository()

    // Verify user exists and token matches
    const user = await userRepo.findByPasswordResetToken(token)
    if (!user) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid or expired reset token'
      }
    }

    // Hash new password
    const passwordHash = await hashUserPassword(password)

    // Update password
    await userRepo.setPassword(user.id!, passwordHash)

    // Clear reset token
    await userRepo.clearPasswordResetToken(user.id!)

    logger.debug('Password reset successfully for user', user.id)

    return {
      success: true
    }

  } catch (error: any) {
    logger.error('Reset password error:', error)
    return sendErrorResponse(event, error)
  }
})
