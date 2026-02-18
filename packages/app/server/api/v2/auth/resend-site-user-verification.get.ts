/**
 * GET /api/v2/auth/resend-site-user-verification
 * Check the current email verification status for a site-user.
 *
 * Authorization: Bearer {user_token} (SiteUser.user_token from WordPress)
 *
 * Response:
 * - 200: { email_verified: boolean }
 * - 401: Invalid or missing token
 * - 403: User verification not complete
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteUserRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { extractTokenFromHeader } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Auth:SiteUserEmailStatus', debug)

  try {
    // Extract user token from Authorization header
    const authHeader = getHeader(event, 'authorization')
    let userToken: string

    try {
      userToken = extractTokenFromHeader(authHeader)
    }
    catch {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Authorization header missing or invalid',
      }
    }

    const siteUserRepo = new SiteUserRepository()
    const userRepo = new UserRepository()

    // Find SiteUser by token
    const siteUser = await siteUserRepo.findByUserToken(userToken)

    if (!siteUser) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Invalid user token',
      }
    }

    if (!siteUser.verified_at) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'User verification not complete',
      }
    }

    // Get user to check validEmail
    const user = await userRepo.findById(siteUser.user_id)
    if (!user) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'User not found',
      }
    }

    return {
      success: true,
      email_verified: Boolean(user.validEmail),
    }
  }
  catch (error: any) {
    logger.error('Email status check error:', error)
    return sendErrorResponse(event, error)
  }
})
