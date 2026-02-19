/**
 * TEST ENDPOINT: Create test user
 *
 * Only available in development/test environment
 * Used for creating test users for e2e tests
 */

import { UserRepository } from '~~/server/utils/database'
import { generateToken, hashUserPassword } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Only allow in development/test
  if (!['development', 'test'].includes(process.env.NODE_ENV || '')) {
    setResponseStatus(event, 403)
    return { error: 'Test endpoints not available in this environment' }
  }

  try {
    const body = await readBody(event)
    const { email, password, withPassword = false } = body

    if (!email) {
      setResponseStatus(event, 400)
      return { error: 'email is required' }
    }

    if (!password) {
      setResponseStatus(event, 400)
      return { error: 'password is required' }
    }

    const userRepo = new UserRepository()

    // Create user
    const user = await userRepo.create({
      email,
      firstname: 'Test',
      lastname: 'User',
      mediavine_publisher: false,
      marketing_opt_in: false,
    })

    // Set password if requested
    let passwordHash = null
    if (withPassword) {
      passwordHash = await hashUserPassword(password)
      await userRepo.setPassword(user.id!, passwordHash)
    }

    // Generate JWT token
    const jwt = await generateToken({
      id: user.id!,
      email: user.email,
      validEmail: false,
    })

    setResponseStatus(event, 201)
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        hasPassword: !!passwordHash,
      },
      jwt,
    }
  } catch (error) {
    console.error('Error creating test user:', error)
    setResponseStatus(event, 500)
    return { error: 'Failed to create test user', details: String(error) }
  }
})
