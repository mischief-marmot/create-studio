/**
 * POST /api/v2/auth/register
 * Register a new user account with email, password, and consent preferences
 *
 * Request body: {
 *   email: string,
 *   password: string,
 *   firstname?: string,
 *   lastname?: string,
 *   marketing_opt_in?: boolean,
 *   site_url?: string (optional - from plugin registration)
 * }
 *
 * Query params: {
 *   source?: 'plugin' (indicates registration from WordPress plugin)
 * }
 *
 * Response codes:
 * - 201 Created: Registration successful
 * - 202 Accepted: Existing user without password, password reset email sent
 * - 409 Conflict: Email already registered with password (should login)
 * - 400 Bad Request: Invalid input
 *
 * Uses session cookies (nuxt-auth-utils) for authentication
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository, SiteRepository, SiteUserRepository } from '~~/server/utils/database'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'
import { normalizeSiteUrl } from '~~/server/utils/url'
import * as bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Register', debug)

  try {
    const body = await readBody(event)
    const query = getQuery(event)
    const {
      email,
      password,
      firstname,
      lastname,
      marketing_opt_in = false,
      site_url,
    } = body
    const source = query.source as string | undefined

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
      // Check if user has a password set
      if (!existingUser.password) {
        // V1 user without password - trigger password reset flow
        logger.debug('V1 user found without password, triggering reset', existingUser.id)

        // Import and call password reset functionality
        const { generatePasswordResetToken } = await import('~~/server/utils/auth')
        const { sendPasswordResetEmail } = await import('~~/server/utils/mailer')

        // Generate reset token
        const resetToken = await generatePasswordResetToken({
          id: existingUser.id!,
          email: existingUser.email,
        })

        // Calculate expiration (1 hour from now)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

        // Store token in database
        await userRepo.setPasswordResetToken(existingUser.id!, resetToken, expiresAt)

        // Send reset email
        await sendPasswordResetEmail(existingUser.email, resetToken, {
          firstname: existingUser.firstname,
          lastname: existingUser.lastname,
        })

        setResponseStatus(event, 202)
        return {
          success: false,
          passwordResetSent: true,
          message: 'An account exists for this email but requires a password. We\'ve sent a password setup link to your email.',
        }
      }
      else {
        // User has account with password - redirect to login
        setResponseStatus(event, 409)
        return {
          success: false,
          shouldLogin: true,
          error: 'An account already exists with this email. Please login instead.',
        }
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

    // Send email verification
    try {
      const { generateValidationToken } = await import('~~/server/utils/auth')
      const { sendValidationEmail } = await import('~~/server/utils/mailer')

      const validationToken = await generateValidationToken({
        id: newUser.id!,
        email: newUser.email,
      })

      await sendValidationEmail(newUser.email, validationToken, {
        firstname: newUser.firstname,
        lastname: newUser.lastname,
      })

      logger.debug('Sent email verification to', newUser.email)
    }
    catch (emailError) {
      // Don't fail registration if email fails - user can request resend
      logger.error('Failed to send verification email:', emailError)
    }

    // Handle site URL from plugin registration
    let siteInfo = null
    let pendingVerification = false

    if (site_url && source === 'plugin') {
      const normalizedUrl = normalizeSiteUrl(site_url)

      if (normalizedUrl) {
        const siteRepo = new SiteRepository()
        const siteUserRepo = new SiteUserRepository()

        // Find or create canonical site
        const site = await siteRepo.findOrCreateCanonicalSite(normalizedUrl, newUser.id!)

        if (site.id) {
          // Create pending SiteUsers record (NOT verified)
          await siteUserRepo.createPending(newUser.id!, site.id, 'owner')

          siteInfo = {
            id: site.id,
            url: site.url,
          }
          pendingVerification = true

          logger.info('Created pending site connection from plugin registration', {
            userId: newUser.id,
            siteId: site.id,
            url: normalizedUrl,
          })
        }
      }
    }

    // Set user session
    await setUserSession(event, {
      user: {
        id: newUser.id!,
        email: newUser.email,
        validEmail: Boolean(newUser.validEmail),
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
      },
    })

    logger.debug('User registered successfully', newUser.id)

    setResponseStatus(event, 201)

    const response: any = {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    }

    // Include site info if registering from plugin
    if (siteInfo) {
      response.site = siteInfo
      response.pendingVerification = pendingVerification
      response.message = 'Go to your WordPress plugin settings to copy the site verification code'
    }

    return response
  }
  catch (error: any) {
    logger.error('Registration error:', error)
    return sendErrorResponse(event, error)
  }
})
