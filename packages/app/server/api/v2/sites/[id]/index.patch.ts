/**
 * PATCH /api/v2/sites/:id
 * Update site information
 *
 * Requires authentication (session)
 * Verifies user owns the site
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SubscriptionRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const {debug} = useRuntimeConfig()
  const logger = useLogger('PatchSiteEndpoint', debug)
  try {
    // Require user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    const siteId = parseInt(getRouterParam(event, 'id') || '0')

    if (!siteId || siteId === 0) {
      setResponseStatus(event, 400)
      logger.debug('Invalid site ID', siteId)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

    // Read body
    const body = await readBody(event)
    const { name, url, interactive_mode_enabled, interactive_mode_button_text } = body

    // Validate input - at least one field must be provided
    const hasGeneralFields = name !== undefined || url !== undefined
    const hasProFields = interactive_mode_enabled !== undefined || interactive_mode_button_text !== undefined

    if (!hasGeneralFields && !hasProFields) {
      setResponseStatus(event, 400)
      logger.debug('No fields to update')
      return {
        success: false,
        error: 'At least one field must be provided'
      }
    }

    const siteRepo = new SiteRepository()

    // Get existing site
    const existingSite = await siteRepo.findById(siteId)
    if (!existingSite) {
      setResponseStatus(event, 404)
      logger.debug('Site not found', existingSite)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // V2 API: Verify this is a canonical site
    if (existingSite.canonical_site_id !== null && existingSite.canonical_site_id !== undefined) {
      setResponseStatus(event, 400)
      logger.debug('Not a canonical site', { siteId, canonicalSiteId: existingSite.canonical_site_id })
      return {
        success: false,
        error: 'Can only update canonical sites'
      }
    }

    // V2 API: Verify user has access via SiteUsers
    const hasAccess = await siteRepo.userHasAccessToSite(userId, siteId)
    if (!hasAccess) {
      setResponseStatus(event, 403)
      logger.debug('User does not have access to site', { userId, siteId })
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    // General fields (always allowed)
    if (name !== undefined) updateData.name = name
    if (url !== undefined) updateData.url = url

    // Pro fields - require Pro subscription
    if (hasProFields) {
      const subscriptionRepo = new SubscriptionRepository()
      const tier = await subscriptionRepo.getActiveTier(siteId)

      if (tier !== 'pro') {
        setResponseStatus(event, 403)
        logger.debug('Pro subscription required for interactive mode settings', { siteId, tier })
        return {
          success: false,
          error: 'Pro subscription required for these settings'
        }
      }

      if (interactive_mode_enabled !== undefined) {
        updateData.interactive_mode_enabled = interactive_mode_enabled ? 1 : 0
      }
      if (interactive_mode_button_text !== undefined) {
        // Validate button text length (max 50 chars)
        if (interactive_mode_button_text && interactive_mode_button_text.length > 50) {
          setResponseStatus(event, 400)
          return {
            success: false,
            error: 'Button text must be 50 characters or less'
          }
        }
        updateData.interactive_mode_button_text = interactive_mode_button_text || null
      }
    }

    // Update site
    const updatedSite = await siteRepo.update(siteId, updateData)

    // Send settings_update webhook to WordPress plugin for pro field changes
    if (hasProFields && existingSite.url) {
      const webhookSettings: Record<string, unknown> = {}
      if (interactive_mode_enabled !== undefined) {
        webhookSettings.interactive_mode_enabled = !!interactive_mode_enabled
      }
      if (interactive_mode_button_text !== undefined) {
        webhookSettings.interactive_mode_button_text = interactive_mode_button_text || ''
      }

      try {
        const { sendWebhook } = await import('~~/server/utils/webhooks')
        await sendWebhook(existingSite.url, {
          type: 'settings_update',
          data: { settings: webhookSettings },
        })
      } catch (webhookError) {
        // Don't fail the request if webhook dispatch fails
        logger.warn('Failed to send settings_update webhook', webhookError)
      }
    }

    // Return response
    setResponseStatus(event, 200)
    logger.debug('Site updated successfully', updatedSite)
    return {
      success: true,
      site: updatedSite
    }

  } catch (error) {
    logger.error('Site update error:', error)
    return sendErrorResponse(event, error)
  }
})
