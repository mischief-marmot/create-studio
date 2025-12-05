/**
 * POST /api/v2/sites/add
 * Add a new site connection for the authenticated user
 *
 * Requires authentication (session)
 * Body: { url: string }
 * Response: { success: boolean, site: Site, pending: boolean, instructions: string }
 *
 * Key Logic:
 * 1. Validate and normalize URL
 * 2. Reject if URL is invalid, non-HTTPS, or points to private/reserved hosts
 * 3. Find or create canonical site by normalized URL
 * 4. Check if user already has a SiteUsers record for this site
 *    - If verified -> return error "Site already connected"
 *    - If pending -> return existing pending record
 * 5. Create row in SiteUsers with verified_at = NULL
 * 6. Return site + instructions for verification
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { normalizeSiteUrl, isValidWordPressSiteUrl } from '~~/server/utils/url'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Add', debug)

  try {
    // Get user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    if (!userId) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Rate limit: 20 site additions per hour per user
    await rateLimitMiddleware(event, {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'site_add:',
      getKey: () => userId.toString(),
    })

    // Parse request body
    const body = await readBody(event)
    const { url } = body

    if (!url || typeof url !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'URL is required'
      }
    }

    // Validate and normalize URL
    const normalizedUrl = normalizeSiteUrl(url)

    if (!normalizedUrl) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid URL. Please provide a valid HTTPS URL.'
      }
    }

    if (!isValidWordPressSiteUrl(normalizedUrl)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid site URL format.'
      }
    }

    logger.debug('Adding site for user', userId, normalizedUrl)

    const siteRepo = new SiteRepository()
    const siteUserRepo = new SiteUserRepository()

    // Find or create canonical site
    const site = await siteRepo.findOrCreateCanonicalSite(normalizedUrl, userId)

    if (!site.id) {
      throw new Error('Failed to create site record')
    }

    // Check if user already has a connection to this site
    const existingConnection = await siteUserRepo.findByUserAndSite(userId, site.id)

    if (existingConnection) {
      if (existingConnection.verified_at) {
        // Already verified
        setResponseStatus(event, 409)
        return {
          success: false,
          error: 'This site is already connected to your account.'
        }
      }

      // Pending connection exists - return it
      logger.debug('Returning existing pending connection', existingConnection)
      return {
        success: true,
        site: {
          id: site.id,
          url: site.url,
          name: site.name
        },
        pending: true,
        instructions: 'Copy the site verification code from your WordPress plugin settings and paste it below to verify your connection.'
      }
    }

    // Create pending connection
    await siteUserRepo.createPending(userId, site.id, 'owner')

    logger.info('Created pending site connection', { userId, siteId: site.id, url: normalizedUrl })

    return {
      success: true,
      site: {
        id: site.id,
        url: site.url,
        name: site.name
      },
      pending: true,
      instructions: 'Copy the site verification code from your WordPress plugin settings and paste it below to verify your connection.'
    }
  }
  catch (error: any) {
    logger.error('Error adding site:', error)
    return sendErrorResponse(event, error)
  }
})
