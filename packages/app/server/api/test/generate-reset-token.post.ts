/**
 * TEST ENDPOINT: Generate password reset token
 *
 * Only available in development/test environment
 * Used for testing password reset flow
 */

import { UserRepository } from '~~/server/utils/database'
import { generatePasswordResetToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Only allow in development/test
  if (!['development', 'test'].includes(process.env.NODE_ENV || '')) {
    setResponseStatus(event, 403)
    return { error: 'Test endpoints not available in this environment' }
  }

  try {
    const body = await readBody(event)
    const { userId, email } = body

    if (!userId || !email) {
      setResponseStatus(event, 400)
      return { error: 'userId and email are required' }
    }

    // Verify user exists
    const userRepo = new UserRepository()
    const user = await userRepo.findById(userId)
    if (!user) {
      setResponseStatus(event, 404)
      return { error: 'User not found' }
    }

    // Generate token
    const token = await generatePasswordResetToken({ id: userId, email })

    // Store token in database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    await userRepo.setPasswordResetToken(userId, token, expiresAt)

    setResponseStatus(event, 200)
    return {
      success: true,
      token,
      userId,
      email,
      expiresAt,
    }
  } catch (error) {
    console.error('Error generating reset token:', error)
    setResponseStatus(event, 500)
    return { error: 'Failed to generate reset token', details: String(error) }
  }
})
