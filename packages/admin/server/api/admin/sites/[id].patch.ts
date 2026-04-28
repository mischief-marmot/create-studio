import { eq } from 'drizzle-orm'
import { useAdminDb, sites, siteMeta } from "~~/server/utils/admin-db"
import type { SiteSettings } from "~~/server/utils/admin-db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'
import { purgeSiteConfigCache } from '~~/server/utils/purge-site-config-cache'

/**
 * PATCH /api/admin/sites/[id]
 * Update site fields (name, url) and settings (interactive_mode_enabled, interactive_mode_button_text)
 * General fields are stored on Sites table; settings are stored on SiteMeta table
 */
export default defineEventHandler(async (event) => {
  // Check admin session
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const db = useAdminDb(event)
  const siteId = parseInt(event.context.params?.id || '0')

  if (!siteId || isNaN(siteId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid site ID',
    })
  }

  try {
    // Get current site
    const siteResult = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (siteResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Site not found',
      })
    }

    const site = siteResult[0]
    const body = await readBody(event)

    const changes: Record<string, any> = {
      before: {},
      after: {},
    }

    let hasUpdates = false
    const hasSiteFields = 'name' in body || 'url' in body
    // List every interactive_mode_* field buildSiteConfig reads, even ones
    // the admin form doesn't expose today. Keeps the cache-purge trigger
    // correct if the form expands later — otherwise a new field added here
    // without touching the trigger silently re-introduces the stale-cache bug.
    const hasInteractiveFields =
      'interactive_mode_enabled' in body
      || 'interactive_mode_button_text' in body
      || 'interactive_mode_cta_variant' in body
      || 'interactive_mode_cta_title' in body
      || 'interactive_mode_cta_subtitle' in body

    // Update Sites table fields (name, url)
    if (hasSiteFields) {
      const updateData: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      }

      if ('name' in body) {
        const newName = body.name?.trim() || null
        updateData.name = newName
        changes.before.name = site.name
        changes.after.name = newName
        hasUpdates = true
      }

      if ('url' in body) {
        const newUrl = body.url?.trim()
        if (!newUrl) {
          throw createError({
            statusCode: 400,
            message: 'URL cannot be empty',
          })
        }
        updateData.url = newUrl
        changes.before.url = site.url
        changes.after.url = newUrl
        hasUpdates = true
      }

      await db
        .update(sites)
        .set(updateData)
        .where(eq(sites.id, siteId))
    }

    // Update SiteMeta settings (interactive mode)
    if (hasInteractiveFields) {
      const metaSettings: Partial<SiteSettings> = {}

      // Get current settings for audit log
      const existingMeta = await db.select().from(siteMeta).where(eq(siteMeta.site_id, siteId)).limit(1)
      const currentSettings = (existingMeta[0]?.settings as SiteSettings) || {}

      if ('interactive_mode_enabled' in body) {
        const enabled = Boolean(body.interactive_mode_enabled)
        metaSettings.interactive_mode_enabled = enabled
        changes.before.interactive_mode_enabled = currentSettings.interactive_mode_enabled
        changes.after.interactive_mode_enabled = enabled
        hasUpdates = true
      }

      if ('interactive_mode_button_text' in body) {
        const text = body.interactive_mode_button_text?.trim() || null
        metaSettings.interactive_mode_button_text = text
        changes.before.interactive_mode_button_text = currentSettings.interactive_mode_button_text
        changes.after.interactive_mode_button_text = text
        hasUpdates = true
      }

      const now = new Date().toISOString()
      if (existingMeta.length > 0) {
        const merged = { ...currentSettings, ...metaSettings }
        await db.update(siteMeta).set({ settings: merged, updatedAt: now }).where(eq(siteMeta.site_id, siteId))
      } else {
        await db.insert(siteMeta).values({
          site_id: siteId,
          settings: metaSettings as SiteSettings,
          version_logs: [],
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    if (!hasUpdates) {
      throw createError({
        statusCode: 400,
        message: 'No fields to update',
      })
    }

    // Trigger watches every input that buildSiteConfig actually reads:
    // settings.interactive_mode_* and the Sites row's url (the cache key
    // itself). If site-config ever starts reading another column (name,
    // create_version, etc.), widen this condition to match.
    const trimmedUrl = typeof body.url === 'string' ? body.url.trim() : undefined
    if (hasInteractiveFields || (hasSiteFields && 'url' in body && trimmedUrl !== site.url)) {
      // Always include the current URL (cache key for the entry holding the
      // values we just wrote). On URL change, also purge the new key so
      // visitors hitting the new URL don't sit on a stale entry until TTL.
      const purgeTargets = [site.url, trimmedUrl && trimmedUrl !== site.url ? trimmedUrl : null]
      await purgeSiteConfigCache(event, purgeTargets, { siteId })
    }

    // Audit log
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'site_updated',
        entity_type: 'site',
        entity_id: siteId,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify(changes),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: new Date().toISOString(),
      })
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
    }

    // Return updated site fields + settings from SiteMeta
    const updatedSite = await db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    const updatedMeta = await db.select({ settings: siteMeta.settings }).from(siteMeta).where(eq(siteMeta.site_id, siteId)).limit(1)
    const settings = updatedMeta[0]?.settings as SiteSettings | undefined

    return {
      success: true,
      message: 'Site updated successfully',
      site: {
        ...updatedSite[0],
        interactive_mode_enabled: settings?.interactive_mode_enabled ?? true,
        interactive_mode_button_text: settings?.interactive_mode_button_text ?? null,
      },
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating site:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update site',
    })
  }
})
