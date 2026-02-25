/**
 * POST /api/v2/auth/login
 * Login with email and password
 *
 * Request body: { email: string, password: string }
 * Response: { success: boolean, user: { id, email, validEmail }, sites: Site[] }
 *
 * Uses session cookies (nuxt-auth-utils) instead of JWT tokens
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Login', debug)

  try {
    const body = await readBody(event)
    const { email, password } = body

    if (!email || !validateEmail(email)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Valid email is required'
      }
    }

    if (!password) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Password is required'
      }
    }

    const userRepo = new UserRepository()
    const user = await userRepo.verifyUserPassword(email, password)

    if (!user) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }

    // Get user's sites
    const siteRows = await db.select({
      id: schema.sites.id,
      url: schema.sites.url,
      user_id: schema.sites.user_id,
      create_version: schema.sites.create_version,
      wp_version: schema.sites.wp_version,
      php_version: schema.sites.php_version,
    }).from(schema.sites).where(eq(schema.sites.user_id, user.id!))

    // Set user session using nuxt-auth-utils
    await setUserSession(event, {
      user: {
        id: user.id!,
        email: user.email,
        validEmail: Boolean(user.validEmail),
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    })

    logger.debug('User logged in successfully', user.id)

    setResponseStatus(event, 200)
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        validEmail: Boolean(user.validEmail)
      },
      sites: siteRows
    }

  } catch (error: any) {
    logger.error('Login error:', error)
    return sendErrorResponse(event, error)
  }
})
