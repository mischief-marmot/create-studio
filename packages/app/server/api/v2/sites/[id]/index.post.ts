/**
 * POST /api/v2/sites/:id
 * Update site version information (from WordPress plugin)
 *
 * This endpoint is called by the WordPress plugin to update version info.
 * It handles both canonical and non-canonical sites by updating the canonical site.
 *
 * Requires JWT authentication (from WordPress plugin token)
 * Body: { php_version?, wp_version?, create_version?, interactive_mode_enabled?, interactive_mode_button_text?, interactive_mode_cta_variant?, interactive_mode_cta_title?, interactive_mode_cta_subtitle? }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteMetaRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'
import { purgeSiteConfigCache } from '~~/server/utils/site-config-cache'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('PostSiteEndpoint', debug)

  try {
    // Verify JWT authentication (WordPress plugin sends Bearer token)
    let jwtPayload
    try {
      jwtPayload = await verifyJWT(event)
    } catch (jwtError) {
      setResponseStatus(event, 401)
      logger.debug('JWT verification failed')
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const siteIdParam = parseInt(getRouterParam(event, 'id') || '0')

    if (!siteIdParam || siteIdParam === 0) {
      setResponseStatus(event, 400)
      logger.debug('Invalid site ID', siteIdParam)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

    // Verify JWT site_id matches the request
    if (jwtPayload.site_id && jwtPayload.site_id !== siteIdParam) {
      setResponseStatus(event, 403)
      logger.debug('JWT site_id mismatch', { jwt: jwtPayload.site_id, param: siteIdParam })
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    // Read body
    const body = await readBody(event)
    const { php_version, wp_version, create_version, interactive_mode_enabled, interactive_mode_button_text, interactive_mode_cta_variant, interactive_mode_cta_title, interactive_mode_cta_subtitle } = body

    // Validate input - at least one field must be provided
    const hasVersionFields = php_version || wp_version || create_version
    const hasSettingsFields = interactive_mode_enabled !== undefined || interactive_mode_button_text !== undefined || interactive_mode_cta_variant !== undefined || interactive_mode_cta_title !== undefined || interactive_mode_cta_subtitle !== undefined

    if (!hasVersionFields && !hasSettingsFields) {
      setResponseStatus(event, 400)
      logger.debug('No fields to update')
      return {
        success: false,
        error: 'At least one field must be provided'
      }
    }

    const siteRepo = new SiteRepository()

    // Get existing site
    const existingSite = await siteRepo.findById(siteIdParam)
    if (!existingSite) {
      setResponseStatus(event, 404)
      logger.debug('Site not found', siteIdParam)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // Determine which site to update - use canonical site if this is non-canonical
    const siteIdToUpdate = existingSite.canonical_site_id || existingSite.id!

    // Update Sites table version fields (only if there's something to update)
    let updatedSite = existingSite
    if (hasVersionFields) {
      const updateData: Record<string, unknown> = {}
      if (php_version) updateData.php_version = php_version
      if (wp_version) updateData.wp_version = wp_version
      if (create_version) updateData.create_version = create_version

      logger.debug('Updating site versions', { siteIdParam, siteIdToUpdate, updateData })
      updatedSite = (await siteRepo.update(siteIdToUpdate, updateData))!
    }

    // Write interactive mode settings to SiteMeta
    if (hasSettingsFields) {
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
      await siteMetaRepo.updateSettings(siteIdToUpdate, metaSettings)
    }

    // Plugin-side toggle of interactive_mode_* needs the same edge-cache
    // purge as the customer-facing PATCH and the admin PATCH — otherwise
    // visitors see stale showInteractiveMode for up to the 10-min TTL.
    // Best-effort: a purge failure (CF API down, etc.) shouldn't 500 the
    // plugin sync after the DB write succeeded.
    if (hasSettingsFields && existingSite.url) {
      try {
        await purgeSiteConfigCache(event, existingSite.url)
      } catch (purgeError) {
        logger.warn('Failed to purge site-config cache after plugin POST:', purgeError)
      }
    }

    // Return response
    setResponseStatus(event, 200)
    logger.debug('Site updated successfully', { siteId: siteIdToUpdate })
    return {
      success: true,
      site: updatedSite
    }

  } catch (error) {
    logger.error('Site version update error:', error)
    return sendErrorResponse(event, error)
  }
})
