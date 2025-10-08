/**
 * POST /api/v2/auth/login
 * Login with email and password
 *
 * Request body: { email: string, password: string }
 * Response: { success: boolean, user: { id, email, validEmail }, sites: Site[] }
 *
 * Uses session cookies (nuxt-auth-utils) instead of JWT tokens
 */

import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'

const { debug } = useRuntimeConfig()
const logger = useLogger('API:Login', debug)

export default defineEventHandler(async (event) => {
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
    const sites = await hubDatabase()
      .prepare('SELECT id, url, user_id, create_version, wp_version, php_version FROM Sites WHERE user_id = ?')
      .bind(user.id)
      .all()

    // Set user session using nuxt-auth-utils
    await setUserSession(event, {
      user: {
        id: user.id!,
        email: user.email,
        validEmail: Boolean(user.validEmail),
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.avatar
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
      sites: sites.results || []
    }

  } catch (error: any) {
    logger.error('Login error:', error)
    return sendErrorResponse(event, error)
  }
})
