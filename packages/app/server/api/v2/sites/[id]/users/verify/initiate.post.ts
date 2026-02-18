/**
 * POST /api/v2/sites/:id/users/verify/initiate
 * Initiate user verification from WordPress plugin
 *
 * Authorization: Bearer {site_api_token} (JWT)
 * Body: { verification_code: string }
 *
 * Behavior:
 * 1. Check if any SiteUser is already verified for this site -> return `already_verified`
 * 2. Store verification_code on the site record (pending_verification_code)
 * 3. Whoever logs into Studio and enters this code gets linked
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'
import { and, eq, isNotNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Users:Verify:Initiate', debug)

  try {
    // Verify JWT token (site API token)
    const jwtPayload = await verifyJWT(event)
    const siteIdFromToken = jwtPayload.site_id

    // Get site ID from route params
    const siteIdParam = parseInt(getRouterParam(event, 'id') || '', 10)

    if (isNaN(siteIdParam)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

    // Verify the token is for this site
    if (siteIdFromToken && siteIdFromToken !== siteIdParam) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Token not authorized for this site'
      }
    }

    // Rate limit: 30 initiate requests per hour per site
    await rateLimitMiddleware(event, {
      maxRequests: 30,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'user_verify_initiate:',
      getKey: () => siteIdParam.toString(),
    })

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

    const siteRepo = new SiteRepository()

    // Find site
    const site = await siteRepo.findById(siteIdParam)
    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'site_not_found',
        message: 'Site not found or not verified'
      }
    }

    logger.debug('Initiating user verification', { siteId: siteIdParam })

    // Check if any user is already verified for this site
    const siteUsers = await db.select().from(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.site_id, siteIdParam),
        isNotNull(schema.siteUsers.verified_at)
      ))
      .limit(1)
      .get()

    if (siteUsers) {
      logger.debug('Site already has a verified user', { siteId: siteIdParam })
      return {
        success: true,
        status: 'already_verified',
      }
    }

    // Check if site already has a pending code
    if (site.pending_verification_code) {
      logger.debug('Site already has pending verification code', { siteId: siteIdParam })
      return {
        success: true,
        status: 'pending',
        verification_code: site.pending_verification_code
      }
    }

    // Store the verification code on the site record
    await siteRepo.setPendingVerificationCode(siteIdParam, verification_code)

    logger.info('Stored pending verification code on site', {
      siteId: siteIdParam,
    })

    return {
      success: true,
      status: 'initiated',
    }
  }
  catch (error: any) {
    logger.error('Error initiating user verification:', error)
    return sendErrorResponse(event, error)
  }
})
