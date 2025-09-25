/**
 * POST /api/services/compat/v1/users
 * Create user and send validation email
 *
 * Maintains compatibility with original Express API
 */

import { UserRepository, SiteRepository } from '~~/server/utils/database'
import { generateToken, generateValidationToken } from '~~/server/utils/auth'
import { sendValidationEmail } from '~~/server/utils/mailer'
import { sendErrorResponse, validateEmail } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body.email) {
      setResponseStatus(event, 401)
      return { error: 'Email is required' }
    }

    if (!validateEmail(body.email)) {
      setResponseStatus(event, 400)
      return { error: 'Invalid email format' }
    }

    const userRepo = new UserRepository()
    const siteRepo = new SiteRepository()

    // Extract user data and site data
    const {
      current_user_email,
      current_firstname,
      current_lastname,
      site_url,
      ...inboundUser
    } = body

    // Check if user already exists
    let user = await userRepo.findByEmail(body.email)

    if (!user) {
      // Create new user
      user = await userRepo.create({
        email: body.email,
        firstname: inboundUser.firstname,
        lastname: inboundUser.lastname,
        mediavine_publisher: inboundUser.mediavine_publisher || false,
        marketing_opt_in: inboundUser.marketing_opt_in || false
      })
    }

    // Handle site creation if site_url provided
    let site: any = [{}]
    if (site_url && user.id) {
      const siteRecord = await siteRepo.findOrCreateByUserAndUrl(user.id, site_url)
      site = [siteRecord]
    }

    const siteId = site[0]?.id || null

    // Generate tokens
    const authToken = await generateToken({
      id: user.id!,
      email: user.email,
      validEmail: Boolean(user.validEmail),
      site_id: siteId
    })

    // Send validation email if user email is not already validated
    if (!user.validEmail) {
      const validationToken = await generateValidationToken({
        id: user.id!,
        email: user.email
      })

      try {
        await sendValidationEmail(user.email, validationToken, {
          firstname: user.firstname,
          lastname: user.lastname
        })
      } catch (emailError) {
        console.error('Failed to send validation email:', emailError)

        // Check if it's a bad email error (406)
        if ((emailError as any)?.code === 406) {
          setResponseStatus(event, 200)
          return { error: 'Bad Email' }
        }

        setResponseStatus(event, 500)
        return { error: 'Failed to send validation email' }
      }
    }

    // Return response in original format
    setResponseStatus(event, 201)
    return {
      site: site[0] || null,
      auth: {
        id: authToken,
        user_id: user.id,
        email: user.email,
        validEmail: Boolean(user.validEmail),
        site_id: siteId
      }
    }

  } catch (error) {
    console.error('User creation error:', error)
    return sendErrorResponse(event, error)
  }
})