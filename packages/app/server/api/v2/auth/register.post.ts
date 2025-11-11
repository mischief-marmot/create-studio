/**
 * POST /api/v2/auth/register
 * Register a new user account with email, password, and consent preferences
 *
 * Request body: {
 *   email: string,
 *   password: string,
 *   firstname?: string,
 *   lastname?: string,
 *   marketing_opt_in?: boolean
 * }
 *
 * Response: { success: boolean, user?: { id, email }, error?: string }
 *
 * Uses session cookies (nuxt-auth-utils) for authentication
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'
import * as bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Register', debug)

  try {
    const body = await readBody(event)
    const {
      email,
      password,
      firstname,
      lastname,
      marketing_opt_in = false,
    } = body

    // Validate required fields
    if (!email || !validateEmail(email)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Valid email is required',
      }
    }

    if (!password || password.length < 8) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Password must be at least 8 characters',
      }
    }

    // Check if user already exists
    const userRepo = new UserRepository()
    const existingUser = await userRepo.findByEmail(email)

    if (existingUser) {
      setResponseStatus(event, 409)
      return {
        success: false,
        error: 'Email already registered',
      }
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create timestamp for consent acceptance (now)
    const now = new Date().toISOString()

    // Create new user with consent timestamps
    const newUser = await userRepo.create({
      email,
      firstname: firstname || undefined,
      lastname: lastname || undefined,
      marketing_opt_in,
      consent_tos_accepted_at: now,
      consent_privacy_accepted_at: now,
      consent_cookies_accepted_at: now,
    })

    // Set password after user creation
    await userRepo.setPassword(newUser.id!, passwordHash)

    // Set user session
    await setUserSession(event, {
      user: {
        id: newUser.id!,
        email: newUser.email,
        validEmail: Boolean(newUser.validEmail),
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        avatar: newUser.avatar,
      },
    })

    logger.debug('User registered successfully', newUser.id)

    setResponseStatus(event, 201)
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    }
  } catch (error: any) {
    logger.error('Registration error:', error)
    return sendErrorResponse(event, error)
  }
})
