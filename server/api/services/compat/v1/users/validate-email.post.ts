/**
 * POST /api/services/compat/v1/users/validate-email
 * Validate user email via token
 *
 * Request body: { token: string }
 * Response: { success: boolean, error?: string }
 */

import { UserRepository } from '~~/server/utils/database'
import { verifyValidationToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token } = body

  if (!token) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: 'No validation token provided'
    }
  }

  try {
    const decodedToken = verifyValidationToken(token)
    const userRepo = new UserRepository()

    const updatedUser = await userRepo.updateEmailValidation(decodedToken.id, true)

    if (!updatedUser) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: "We couldn't validate your email address with this token"
      }
    }

    return {
      success: true
    }

  } catch (error: any) {
    console.error('Email validation error:', error)

    if (error.name === 'TokenExpiredError') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Validation token has expired. Please request a new one.'
      }
    }

    if (error.name === 'JsonWebTokenError') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid validation token'
      }
    }

    setResponseStatus(event, 500)
    return {
      success: false,
      error: 'An error occurred during validation'
    }
  }
})