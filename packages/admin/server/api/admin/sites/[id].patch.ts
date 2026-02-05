import { eq } from 'drizzle-orm'
import { sites } from "~~/server/utils/admin-db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * PATCH /api/admin/sites/[id]
 * Update site fields (name, url, interactive_mode_enabled, interactive_mode_button_text)
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

    // Build update data
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }

    const changes: Record<string, any> = {
      before: {},
      after: {},
    }

    let hasUpdates = false

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

    if ('interactive_mode_enabled' in body) {
      const enabled = Boolean(body.interactive_mode_enabled)
      updateData.interactive_mode_enabled = enabled
      changes.before.interactive_mode_enabled = site.interactive_mode_enabled
      changes.after.interactive_mode_enabled = enabled
      hasUpdates = true
    }

    if ('interactive_mode_button_text' in body) {
      const text = body.interactive_mode_button_text?.trim() || null
      updateData.interactive_mode_button_text = text
      changes.before.interactive_mode_button_text = site.interactive_mode_button_text
      changes.after.interactive_mode_button_text = text
      hasUpdates = true
    }

    if (!hasUpdates) {
      throw createError({
        statusCode: 400,
        message: 'No fields to update',
      })
    }

    // Update site
    await db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, siteId))

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

    // Return updated site fields
    const updatedResult = await db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        interactive_mode_enabled: sites.interactive_mode_enabled,
        interactive_mode_button_text: sites.interactive_mode_button_text,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    return {
      success: true,
      message: 'Site updated successfully',
      site: updatedResult[0],
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
