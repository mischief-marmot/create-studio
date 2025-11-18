/**
 * POST /api/v2/users/consent
 * Sync user consent preferences to the database
 * Only accessible to authenticated users
 *
 * Request body: {
 *   analytics?: boolean,
 *   marketing?: boolean
 * }
 *
 * Response: { success: boolean, message?: string, error?: string }
 *
 * This endpoint allows authenticated users to sync their browser-side
 * consent preferences to the database for cross-device persistence.
 *
 * Note: Consent preferences map to database fields as follows:
 * - analytics: controls consent_cookies_accepted_at (analytics cookies consent)
 * - marketing: controls marketing cookie consent (for future use)
 * - TOS and Privacy consent are tracked separately during registration
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:SyncConsent', debug)

  try {
    // Require authenticated user
    const session = await requireUserSession(event)

    if (!session?.user?.id) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const body = await readBody(event)
    const { analytics, marketing } = body

    // Validate input types
    if (analytics !== undefined && typeof analytics !== 'boolean') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid analytics value - must be a boolean',
      }
    }

    if (marketing !== undefined && typeof marketing !== 'boolean') {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid marketing value - must be a boolean',
      }
    }

    const userRepo = new UserRepository()
    const now = new Date().toISOString()

    // Update consent timestamps based on what was accepted or rejected
    // NOTE: analytics controls consent_cookies_accepted_at for analytics cookie consent
    // marketing preference is stored for future use (currently no dedicated field)
    const updates: any = {}

    if (analytics !== undefined) {
      updates.consent_cookies_accepted_at = analytics ? now : null
    }

    // Marketing consent is noted but not persisted to database yet
    // This can be extended when a dedicated marketing consent field is added
    if (marketing !== undefined) {
      logger.debug('Marketing consent received', { userId: session.user.id, marketing })
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      await userRepo.update(session.user.id, updates)
    }

    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Consent preferences saved',
    }
  } catch (error: any) {
    logger.error('Consent sync error:', error)

    if (error.message?.includes('Authentication')) {
      setResponseStatus(event, 401)
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return sendErrorResponse(event, error)
  }
})
