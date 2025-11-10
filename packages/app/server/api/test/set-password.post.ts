/**
 * TEST ENDPOINT: Set user password
 *
 * Only available in development/test environment
 * Used for testing password-related functionality
 */

import { UserRepository } from '~~/server/utils/database'
import { hashUserPassword } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Only allow in development/test
  if (!['development', 'test'].includes(process.env.NODE_ENV || '')) {
    setResponseStatus(event, 403)
    return { error: 'Test endpoints not available in this environment' }
  }

  try {
    const body = await readBody(event)
    const { userId, password } = body

    if (!userId || !password) {
      setResponseStatus(event, 400)
      return { error: 'userId and password are required' }
    }

    const hashedPassword = await hashUserPassword(password)
    const userRepo = new UserRepository()
    const result = await userRepo.setPassword(userId, hashedPassword)

    if (!result) {
      setResponseStatus(event, 404)
      return { error: 'User not found' }
    }

    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Password set successfully',
      user: {
        id: result.id,
        email: result.email,
        hasPassword: !!result.password,
      },
    }
  } catch (error) {
    console.error('Error setting password:', error)
    setResponseStatus(event, 500)
    return { error: 'Failed to set password', details: String(error) }
  }
})
