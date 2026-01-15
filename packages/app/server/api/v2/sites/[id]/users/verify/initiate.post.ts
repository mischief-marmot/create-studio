/**
 * POST /api/v2/sites/:id/users/verify/initiate
 * Initiate user verification from WordPress plugin
 *
 * Authorization: Bearer {site_api_token} (JWT)
 * Body: { email: string, verification_code: string }
 *
 * Behavior:
 * 1. Check if SiteUser record exists for this email/site:
 *    - If verified -> Return `already_verified` status with existing token
 *    - If pending (has code, no verified_at) -> Return existing verification code
 *    - If not found -> Continue to step 2
 * 2. If email exists in Create.Studio, find user; otherwise create new user
 * 3. Create SiteUser record with verification_code
 * 4. SiteUser remains unverified (verified_at = null)
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteUserRepository, UserRepository } from '~~/server/utils/database'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

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
    const { email, verification_code } = body

    if (!email || typeof email !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Email is required'
      }
    }

    if (!validateEmail(email)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid email format'
      }
    }

    if (!verification_code || typeof verification_code !== 'string') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Verification code is required'
      }
    }

    const siteRepo = new SiteRepository()
    const siteUserRepo = new SiteUserRepository()
    const userRepo = new UserRepository()

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

    logger.debug('Initiating user verification', { siteId: siteIdParam, email })

    // Check for existing user by email
    let user = await userRepo.findByEmail(email.toLowerCase())
    let userCreated = false

    // Check if SiteUser exists for this email/site
    let siteUser = user ? await siteUserRepo.findByUserAndSite(user.id, siteIdParam) : null

    if (siteUser) {
      // Case 1: Already verified - return existing token
      if (siteUser.verified_at) {
        logger.debug('User already verified', { siteId: siteIdParam, email })
        return {
          success: true,
          status: 'already_verified',
          user_token: siteUser.user_token,
          email: user!.email
        }
      }

      // Case 2: Pending verification - return existing code
      if (siteUser.verification_code) {
        logger.debug('User has pending verification', { siteId: siteIdParam, email })
        return {
          success: true,
          status: 'pending',
          verification_code: siteUser.verification_code
        }
      }

      // Case 3: Record exists but no code - update with new code
      await siteUserRepo.setVerificationCode(user!.id, siteIdParam, verification_code)
      logger.debug('Updated existing SiteUser with verification code', { siteId: siteIdParam, email })

      return {
        success: true,
        user_created: false,
        site_user_id: `${siteIdParam}_${user!.id}`
      }
    }

    // No SiteUser exists - create user if needed and create SiteUser
    if (!user) {
      // Create new user
      user = await userRepo.create({
        email: email.toLowerCase(),
      })
      userCreated = true
      logger.debug('Created new user', { userId: user.id, email })
    }

    // Create SiteUser record with verification code
    const now = new Date().toISOString()
    await db.insert(schema.siteUsers).values({
      site_id: siteIdParam,
      user_id: user.id,
      role: 'admin',
      verification_code: verification_code,
      verified_at: null,
      joined_at: now,
    })

    logger.info('Created SiteUser with verification code', {
      siteId: siteIdParam,
      userId: user.id,
      email,
      userCreated
    })

    return {
      success: true,
      user_created: userCreated,
      site_user_id: `${siteIdParam}_${user.id}`
    }
  }
  catch (error: any) {
    logger.error('Error initiating user verification:', error)
    return sendErrorResponse(event, error)
  }
})
