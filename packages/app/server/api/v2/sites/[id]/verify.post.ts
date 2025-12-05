/**
 * POST /api/v2/sites/:id/verify
 * Verify site connection using code from WordPress plugin
 *
 * Requires authentication (session)
 * Body: { verification_code: string }
 * Response: { success: boolean, site: Site, verified_at: string }
 *
 * Key Logic:
 * 1. Find site by ID
 * 2. Find SiteUsers record for current user + this site
 * 3. If already verified -> return error
 * 4. Call WordPress plugin to verify code
 * 5. If valid -> mark SiteUsers.verified_at = NOW()
 * 6. Update site metadata from plugin response
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'
import { generateToken } from '~~/server/utils/auth'

const VERIFY_TIMEOUT = 10000 // 10 seconds

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Verify', debug)
  try {
    // Get user session first so we can use userId for rate limiting
    const session = await requireUserSession(event)
    const userId = session.user.id
    // Rate limit: 10 verification attempts per 15 minutes per user
    await rateLimitMiddleware(event, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      keyPrefix: 'site_verify:',
      getKey: () => userId?.toString() || getRequestIP(event, { xForwardedFor: true }) || 'unknown',
    })
    logger.debug('Verifying user', { userId })

    if (!userId) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Get site ID from route params
    const siteId = parseInt(getRouterParam(event, 'id') || '', 10)
    logger.debug('Verifying site', { siteId, userId })

    if (isNaN(siteId)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

    // Parse request body
    const body = await readBody(event)
    const { verification_code } = body

    if (!verification_code || typeof verification_code !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Verification code is required'
      }
    }

    // Validate code format (should be 32 alphanumeric characters)
    if (!/^[a-zA-Z0-9]{32}$/.test(verification_code)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid verification code format'
      }
    }

    const siteRepo = new SiteRepository()
    const siteUserRepo = new SiteUserRepository()
    const userRepo = new UserRepository()

    // Find site
    const site = await siteRepo.findById(siteId)

    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // Find user's connection to this site
    const siteUser = await siteUserRepo.findByUserAndSite(userId, siteId)

    if (!siteUser) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'You do not have a pending connection to this site. Please add the site first.'
      }
    }

    if (siteUser.verified_at) {
      // Already verified
      return {
        success: true,
        site,
        verified_at: siteUser.verified_at,
        message: 'Site is already verified'
      }
    }

    // Call WordPress plugin to verify code
    logger.debug('Verifying code with WordPress plugin', { siteId, url: site.url })

    // Get user info for generating JWT
    const user = await userRepo.findById(userId)
    if (!user) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Generate JWT token to send to the plugin
    const token = await generateToken({
      id: userId,
      email: user.email,
      validEmail: true,
      site_id: siteId
    })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT)

      // Ensure site URL has protocol
      let siteUrlWithProtocol = site.url
      if (!siteUrlWithProtocol.startsWith('http://') && !siteUrlWithProtocol.startsWith('https://')) {
        siteUrlWithProtocol = `https://${siteUrlWithProtocol}`
      }

      const pluginResponse = await $fetch<{
        valid: boolean
        error?: string
        site_url?: string
        site_name?: string
        wp_version?: string
        php_version?: string
        create_version?: string
      }>(`${siteUrlWithProtocol}/wp-json/mv-create/v1/verify-site-code`, {
        method: 'POST',
        body: {
          code: verification_code,
          token: token,
          user_id: userId
        },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))

      if (!pluginResponse.valid) {
        setResponseStatus(event, 401)
        return {
          success: false,
          error: pluginResponse.error || 'Invalid verification code'
        }
      }

      // Code is valid - mark connection as verified
      const verifiedConnection = await siteUserRepo.markVerified(userId, siteId)

      // Mark user's email as valid (they've proven site access)
      await userRepo.updateEmailValidation(userId, true)

      // Update site metadata from plugin response
      if (pluginResponse.wp_version || pluginResponse.php_version || pluginResponse.create_version || pluginResponse.site_name) {
        await siteRepo.update(siteId, {
          name: pluginResponse.site_name || site.name,
          wp_version: pluginResponse.wp_version,
          php_version: pluginResponse.php_version,
          create_version: pluginResponse.create_version
        })
      }

      logger.info('Site verified successfully', { userId, siteId, url: site.url })

      return {
        success: true,
        site: {
          ...site,
          name: pluginResponse.site_name || site.name,
          wp_version: pluginResponse.wp_version,
          php_version: pluginResponse.php_version,
          create_version: pluginResponse.create_version
        },
        verified_at: verifiedConnection?.verified_at
      }
    }
    catch (fetchError: any) {
      logger.error('Error verifying with plugin:', fetchError)

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
        error: 'Could not verify with your WordPress site. Please ensure the Create plugin is active and try again.'
      }
    }
  }
  catch (error: any) {
    logger.error('Error verifying site:', error)
    return sendErrorResponse(event, error)
  }
})
