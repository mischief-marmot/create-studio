/**
 * POST /api/v2/auth/reset-password
 * Reset password using token and automatically authenticate the user
 *
 * Request body: { token: string, password: string }
 * Response: { success: boolean, user?: { id, email }, error?: string }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository, SiteRepository } from '~~/server/utils/database'
import { verifyPasswordResetToken, hashUserPassword } from '~~/server/utils/auth'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:ResetPassword', debug)

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

    // Link user to all their sites in SiteUsers
    const siteRepo = new SiteRepository()
    const userSitesData = await userRepo.findByIdWithSites(user.id!)

    if (userSitesData?.Sites) {
      for (const site of userSitesData.Sites) {
        await siteRepo.addUserToSite(site.id!, user.id!, 'admin')
      }
    }

    // Automatically authenticate the user after password reset
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email
      }
    })

    logger.debug('Password reset successfully and user authenticated for user', user.id)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    }

  } catch (error: any) {
    logger.error('Reset password error:', error)
    return sendErrorResponse(event, error)
  }
})
