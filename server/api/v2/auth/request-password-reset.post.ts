/**
 * POST /api/v1/auth/request-password-reset
 * Request a password reset/creation email
 * Works for both new password creation and password resets
 *
 * Request body: { email: string }
 * Response: { success: boolean, error?: string }
 */

import { UserRepository } from '~~/server/utils/database'
import { generatePasswordResetToken } from '~~/server/utils/auth'
import { sendPasswordResetEmail } from '~~/server/utils/mailer'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'

const { debug } = useRuntimeConfig()
const logger = useLogger('API:RequestPasswordReset', debug)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email } = body

    if (!email || !validateEmail(email)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Valid email is required'
      }
    }

    const userRepo = new UserRepository()
    const user = await userRepo.findByEmail(email)

    // Always return success to prevent email enumeration
    // Send email if user exists (whether they have a password or not)
    if (user) {
      // Generate reset token
      const resetToken = await generatePasswordResetToken({
        id: user.id!,
        email: user.email
      })

      // Calculate expiration (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      // Store token in database
      await userRepo.setPasswordResetToken(user.id!, resetToken, expiresAt)

      // Send reset email
      try {
        await sendPasswordResetEmail(user.email, resetToken, {
          firstname: user.firstname,
          lastname: user.lastname
        })
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError)
        setResponseStatus(event, 500)
        return {
          success: false,
          error: 'Failed to send password reset email'
        }
      }

      logger.debug('Password reset/creation email sent to', email)
    } else {
      logger.debug('Password reset requested for non-existent user', email)
    }

    // Always return success
    return {
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.'
    }

  } catch (error: any) {
    logger.error('Request password reset error:', error)
    return sendErrorResponse(event, error)
  }
})
