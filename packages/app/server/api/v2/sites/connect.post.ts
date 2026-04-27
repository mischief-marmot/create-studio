/**
 * POST /api/v2/sites/connect
 * Complete site connection using token-based redirect flow (Site Connection V2)
 *
 * Requires authentication (session)
 * Body: { site_url: string, connect_token: string, return_url: string }
 * Response: { success: boolean, return_url: string, user_token: string, email: string }
 *
 * Key Logic:
 * 1. Validate session and rate limit
 * 2. Normalize and validate site URL
 * 3. Find or create canonical site
 * 4. Generate site JWT and create verified SiteUser
 * 5. Callback to WP plugin with connect_token and JWT
 * 6. Update site metadata from WP response
 * 7. Return success with return_url and user_token
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'
import { generateSiteToken } from '~~/server/utils/auth'
import { normalizeSiteUrl, isValidWordPressSiteUrl, parseAllowedTestDomains } from '~~/server/utils/url'

const CALLBACK_TIMEOUT = 15000 // 15 seconds

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { debug } = config
  const logger = useLogger('API:Sites:Connect', debug)
  try {
    // Get user session first so we can use userId for rate limiting
    const session = await requireUserSession(event)
    const userId = session.user.id
    // Rate limit: 10 connect attempts per 15 minutes per user
    await rateLimitMiddleware(event, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      keyPrefix: 'site_connect:',
      getKey: () => userId?.toString() || getRequestIP(event, { xForwardedFor: true }) || 'unknown',
    })
    logger.debug('Processing site connect', { userId })

    if (!userId) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Parse request body
    const body = await readBody(event)
    const { site_url, connect_token, return_url } = body

    if (!site_url || typeof site_url !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'site_url is required'
      }
    }

    if (!connect_token || typeof connect_token !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'connect_token is required'
      }
    }

    if (!return_url || typeof return_url !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'return_url is required'
      }
    }

    // Normalize and validate site URL
    const allowedDomains = parseAllowedTestDomains(config.allowedTestDomains)
    const normalizedUrl = normalizeSiteUrl(site_url, { allowedDomains })

    if (!normalizedUrl) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid site URL'
      }
    }

    if (!isValidWordPressSiteUrl(site_url, { allowedDomains })) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid WordPress site URL'
      }
    }

    const siteRepo = new SiteRepository()
    const siteUserRepo = new SiteUserRepository()
    const userRepo = new UserRepository()

    // Find or create canonical site
    const site = await siteRepo.findOrCreateCanonicalSite(normalizedUrl, userId)
    logger.debug('Found/created site', { siteId: site.id, url: site.url })

    // Generate site JWT
    const jwt = await generateSiteToken(site.id)

    // Create SiteUser and mark as verified
    await siteUserRepo.createPending(userId, site.id, 'owner')
    const verifiedResult = await siteUserRepo.markVerifiedWithToken(userId, site.id)

    // Get user info for email
    const user = await userRepo.findById(userId)
    if (!user) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Callback to WP plugin with connect_token and JWT
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), CALLBACK_TIMEOUT)

      // Ensure site URL has protocol
      let siteUrlWithProtocol = site.url
      if (!siteUrlWithProtocol.startsWith('http://') && !siteUrlWithProtocol.startsWith('https://')) {
        // Use HTTP for localhost/local domains, HTTPS for everything else
        const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?/.test(siteUrlWithProtocol) || siteUrlWithProtocol.endsWith('.local') || siteUrlWithProtocol.endsWith('.test')
        siteUrlWithProtocol = `${isLocal ? 'http' : 'https'}://${siteUrlWithProtocol}`
      }

      const pluginResponse = await $fetch<{
        success: boolean
        error?: string
        site_name?: string
        wp_version?: string
        php_version?: string
        create_version?: string
      }>(`${siteUrlWithProtocol}/wp-json/mv-create/v1/site-connect/callback`, {
        method: 'POST',
        body: {
          connect_token,
          jwt,
          site_id: site.id,
          user_token: verifiedResult.token,
          user_email: user.email,
        },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))

      // Update site metadata from plugin response
      if (pluginResponse.wp_version || pluginResponse.php_version || pluginResponse.create_version || pluginResponse.site_name) {
        await siteRepo.update(site.id, {
          name: pluginResponse.site_name || site.name,
          wp_version: pluginResponse.wp_version,
          php_version: pluginResponse.php_version,
          create_version: pluginResponse.create_version
        })
      }

      logger.info('Site connected successfully', { userId, siteId: site.id, url: site.url })

      return {
        success: true,
        return_url,
        user_token: verifiedResult.token,
        email: user.email
      }
    }
    catch (fetchError: any) {
      logger.error('Error calling WP callback:', fetchError)

      // Handle specific error types
      if (fetchError.name === 'AbortError') {
        setResponseStatus(event, 502)
        return {
          success: false,
          error: 'Request timed out. Please ensure your WordPress site is accessible and try again.'
        }
      }

      if (fetchError.statusCode === 404) {
        setResponseStatus(event, 502)
        return {
          success: false,
          error: 'Create plugin REST endpoint not found. Please ensure the Create plugin is installed and activated.'
        }
      }

      if (fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ENOTFOUND') {
        setResponseStatus(event, 502)
        return {
          success: false,
          error: 'Could not reach your WordPress site. Please ensure the site is accessible and try again.'
        }
      }

      // For other errors, return a generic message
      setResponseStatus(event, 502)
      return {
        success: false,
        error: 'Could not connect to your WordPress site. Please ensure the Create plugin is active and try again.'
      }
    }
  }
  catch (error: any) {
    logger.error('Error connecting site:', error)
    return sendErrorResponse(event, error)
  }
})
