/**
 * POST /api/v2/auth/sso
 * Generate SSO URL for WordPress plugin users
 *
 * Authorization: Bearer {user_token} (SiteUser.user_token from WordPress)
 * Body: { return_url?: string }
 *
 * Response:
 * {
 *   sso_url: string - URL with short-lived token for SSO
 *   expires_at: string - ISO timestamp when the SSO token expires
 * }
 *
 * The SSO URL contains a signed token that expires in 5 minutes.
 * When the user visits this URL, they will be automatically logged in
 * and redirected to the return_url.
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteUserRepository, UserRepository, SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { extractTokenFromHeader } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'
import { SignJWT } from 'jose'

/**
 * Generate a short-lived SSO token
 */
async function generateSSOToken(userId: number, siteId: number, email: string): Promise<{ token: string; expiresAt: Date }> {
  const config = useRuntimeConfig()
  const secret = config.servicesApiJWTSecret || process.env.NUXT_SERVICES_API_JWT_SECRET

  if (!secret) {
    throw new Error('JWT secret is not configured')
  }

  const secretKey = new TextEncoder().encode(secret)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  const token = await new SignJWT({
    type: 'sso',
    user_id: userId,
    site_id: siteId,
    email: email
  } as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey)

  return { token, expiresAt }
}

export default defineEventHandler(async (event) => {
  const { debug, public: { rootUrl } } = useRuntimeConfig()
  const logger = useLogger('API:Auth:SSO', debug)

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
        error: 'Authorization header missing or invalid'
      }
    }

    const siteUserRepo = new SiteUserRepository()
    const userRepo = new UserRepository()
    const siteRepo = new SiteRepository()

    // Find SiteUser by token
    const siteUser = await siteUserRepo.findByUserToken(userToken)

    if (!siteUser) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Invalid user token'
      }
    }

    // Verify user is verified (has verified_at set)
    if (!siteUser.verified_at) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'User verification not complete'
      }
    }

    // Rate limit: 20 SSO requests per hour per user
    await rateLimitMiddleware(event, {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'sso:',
      getKey: () => `${siteUser.site_id}_${siteUser.user_id}`,
    })

    // Get user details
    const user = await userRepo.findById(siteUser.user_id)
    if (!user) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Get site details
    const site = await siteRepo.findById(siteUser.site_id)
    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // Parse request body for optional return_url
    const body = await readBody(event).catch(() => ({}))
    const returnUrl = body.return_url || '/admin'

    // Validate return_url (must be a relative path or same-origin URL)
    if (returnUrl && typeof returnUrl === 'string') {
      // Allow relative paths
      if (!returnUrl.startsWith('/') && !returnUrl.startsWith(rootUrl)) {
        setResponseStatus(event, 400)
        return {
          success: false,
          error: 'Invalid return_url - must be a relative path or same-origin URL'
        }
      }
    }

    // Generate SSO token
    const { token: ssoToken, expiresAt } = await generateSSOToken(
      user.id,
      site.id,
      user.email
    )

    // Build SSO URL
    const ssoUrl = new URL('/auth/sso', rootUrl)
    ssoUrl.searchParams.set('token', ssoToken)
    ssoUrl.searchParams.set('redirect', returnUrl)

    logger.info('Generated SSO URL', {
      userId: user.id,
      siteId: site.id,
      expiresAt: expiresAt.toISOString()
    })

    return {
      sso_url: ssoUrl.toString(),
      expires_at: expiresAt.toISOString()
    }
  }
  catch (error: any) {
    logger.error('Error generating SSO URL:', error)
    return sendErrorResponse(event, error)
  }
})
