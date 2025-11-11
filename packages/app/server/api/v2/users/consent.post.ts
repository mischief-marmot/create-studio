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

    const userRepo = new UserRepository()
    const now = new Date().toISOString()

    // Update consent timestamps based on what was accepted or rejected
    const updates: any = {}

    if (analytics !== undefined) {
      updates.consent_cookies_accepted_at = analytics ? now : null
    }

    if (marketing !== undefined) {
      updates.consent_tos_accepted_at = marketing ? now : null
      updates.consent_privacy_accepted_at = marketing ? now : null
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      logger.debug('updates', updates)
      await userRepo.update(session.user.id, updates)
    }

    logger.debug('User consent synced', session.user.id)

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
