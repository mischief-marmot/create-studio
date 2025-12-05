/**
 * POST /api/v2/auth/resend-verification
 * Resend email verification for the authenticated user
 *
 * Response codes:
 * - 200 OK: Verification email sent
 * - 400 Bad Request: Email already verified
 * - 401 Unauthorized: Not authenticated
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:ResendVerification', debug)

  try {
    // Get current session
    const session = await getUserSession(event)

    if (!session?.user?.id) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const userId = session.user.id
    const userEmail = session.user.email

    // Check if already verified
    if (session.user.validEmail) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Email is already verified',
      }
    }

    // Generate and send verification email
    const { generateValidationToken } = await import('~~/server/utils/auth')
    const { sendValidationEmail } = await import('~~/server/utils/mailer')

    const validationToken = await generateValidationToken({
      id: userId,
      email: userEmail,
    })

    await sendValidationEmail(userEmail, validationToken, {
      firstname: session.user.firstname,
      lastname: session.user.lastname,
    })

    logger.debug('Resent verification email to', userEmail)

    return {
      success: true,
      message: 'Verification email sent',
    }
  }
  catch (error: any) {
    logger.error('Resend verification error:', error)
    return sendErrorResponse(event, error)
  }
})
