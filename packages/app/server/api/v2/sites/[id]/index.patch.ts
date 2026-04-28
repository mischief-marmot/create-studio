/**
 * PATCH /api/v2/sites/:id
 * Update site information
 *
 * Requires authentication (session)
 * Verifies user owns the site
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SubscriptionRepository, SiteMetaRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { purgeSiteConfigCache } from '~~/server/utils/site-config-cache'

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
    const { name, url, interactive_mode_enabled, interactive_mode_button_text, interactive_mode_cta_variant, interactive_mode_cta_title, interactive_mode_cta_subtitle } = body

    // Validate input - at least one field must be provided
    const hasGeneralFields = name !== undefined || url !== undefined
    const hasProFields = interactive_mode_enabled !== undefined || interactive_mode_button_text !== undefined || interactive_mode_cta_variant !== undefined || interactive_mode_cta_title !== undefined || interactive_mode_cta_subtitle !== undefined

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

    // Update general site fields
    if (hasGeneralFields) {
      const updateData: Record<string, unknown> = {}
      if (name !== undefined) updateData.name = name
      if (url !== undefined) updateData.url = url
      await siteRepo.update(siteId, updateData)
    }

    // Pro fields - require Pro subscription, write to SiteMeta
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

      if (interactive_mode_button_text !== undefined) {
        // Validate button text length (max 50 chars)
        if (interactive_mode_button_text && interactive_mode_button_text.length > 50) {
          setResponseStatus(event, 400)
          return {
            success: false,
            error: 'Button text must be 50 characters or less'
          }
        }
      }

      if (interactive_mode_cta_variant !== undefined) {
        const allowedVariants = ['button', 'inline-banner', 'sticky-bar', 'tooltip']
        if (!allowedVariants.includes(interactive_mode_cta_variant)) {
          setResponseStatus(event, 400)
          return {
            success: false,
            error: 'Invalid CTA variant. Must be one of: button, inline-banner, sticky-bar, tooltip'
          }
        }
      }

      if (interactive_mode_cta_title !== undefined) {
        if (interactive_mode_cta_title && interactive_mode_cta_title.length > 50) {
          setResponseStatus(event, 400)
          return {
            success: false,
            error: 'CTA title must be 50 characters or less'
          }
        }
      }

      if (interactive_mode_cta_subtitle !== undefined) {
        if (interactive_mode_cta_subtitle && interactive_mode_cta_subtitle.length > 80) {
          setResponseStatus(event, 400)
          return {
            success: false,
            error: 'CTA subtitle must be 80 characters or less'
          }
        }
      }

      const siteMetaRepo = new SiteMetaRepository()
      const metaSettings: Record<string, unknown> = {}
      if (interactive_mode_enabled !== undefined) {
        metaSettings.interactive_mode_enabled = !!interactive_mode_enabled
      }
      if (interactive_mode_button_text !== undefined) {
        metaSettings.interactive_mode_button_text = interactive_mode_button_text || null
      }
      if (interactive_mode_cta_variant !== undefined) {
        metaSettings.interactive_mode_cta_variant = interactive_mode_cta_variant
      }
      if (interactive_mode_cta_title !== undefined) {
        metaSettings.interactive_mode_cta_title = interactive_mode_cta_title || null
      }
      if (interactive_mode_cta_subtitle !== undefined) {
        metaSettings.interactive_mode_cta_subtitle = interactive_mode_cta_subtitle || null
      }
      await siteMetaRepo.updateSettings(siteId, metaSettings)
    }

    // Send settings_update webhook to WordPress plugin for pro field changes
    if (hasProFields && existingSite.url) {
      const webhookSettings: Record<string, unknown> = {}
      if (interactive_mode_enabled !== undefined) {
        webhookSettings.interactive_mode_enabled = !!interactive_mode_enabled
      }
      if (interactive_mode_button_text !== undefined) {
        webhookSettings.interactive_mode_button_text = interactive_mode_button_text || ''
      }
      if (interactive_mode_cta_variant !== undefined) {
        webhookSettings.interactive_mode_cta_variant = interactive_mode_cta_variant
      }
      if (interactive_mode_cta_title !== undefined) {
        webhookSettings.interactive_mode_cta_title = interactive_mode_cta_title || ''
      }
      if (interactive_mode_cta_subtitle !== undefined) {
        webhookSettings.interactive_mode_cta_subtitle = interactive_mode_cta_subtitle || ''
      }

      try {
        const { enqueueSettingsUpdate } = await import('~~/server/utils/message-queue')
        await enqueueSettingsUpdate(siteId, existingSite.url, webhookSettings, event)
      } catch (webhookError) {
        // Don't fail the request if webhook dispatch fails — the queue
        // row (if it landed) will retry on the cron tick.
        logger.warn('Failed to enqueue settings_update webhook', webhookError)
      }
    }

    // Return updated site
    const updatedSite = await siteRepo.findById(siteId)

    // interactive_mode_* settings drive the /api/v2/site-config/<key>
    // response served to widget visitors. Without this purge, edge entries
    // serve the pre-toggle config for up to the 10-min TTL. Also purge on
    // url changes since the cache key is keyed on the URL.
    //
    // hasProFields is a tight match for the inputs to buildSiteConfig
    // (interactive_mode_enabled + button_text + cta_variant/title/subtitle) —
    // every one of those round-trips into the cached response, so purging
    // whenever any is touched is correct, not over-eager.
    const needsConfigPurge = hasProFields || (url !== undefined && url !== existingSite.url)
    if (needsConfigPurge && existingSite.url) {
      const purgeTargets = [existingSite.url]
      if (url && url !== existingSite.url) purgeTargets.push(url)
      // The await here only blocks on the in-DC `cache.delete`. The global
      // CF zone purge runs under `ctx.waitUntil` inside purgeSiteConfigCache
      // (fire-and-forget), so we won't see a global-purge failure here.
      // Best-effort: a purge failure shouldn't 500 the PATCH after the DB
      // write succeeded.
      try {
        await Promise.all(purgeTargets.map(u => purgeSiteConfigCache(event, u)))
      } catch (purgeError) {
        logger.warn('Failed to purge site-config cache after PATCH:', purgeError)
      }
    }

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
