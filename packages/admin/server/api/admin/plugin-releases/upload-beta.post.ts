import { getAdminEnvironment } from '~~/server/utils/admin-env'
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * POST /api/admin/plugin-releases/upload-beta
 *
 * Proxies a beta plugin upload from the admin UI to the main app.
 * Accepts multipart form data with a .zip file and optional version.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const config = useRuntimeConfig()
  const adminEnv = getAdminEnvironment(event)
  const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
  const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')

  if (!mainAppUrl) {
    throw createError({
      statusCode: 500,
      message: 'Main app URL not configured',
    })
  }

  try {
    // Read the multipart form data from the admin request
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file provided',
      })
    }

    const filePart = formData.find(part => part.name === 'file')
    const versionPart = formData.find(part => part.name === 'version')

    if (!filePart || !filePart.data) {
      throw createError({
        statusCode: 400,
        message: 'No file provided. Upload a .zip file.',
      })
    }

    // Build the multipart body to forward to the main app
    const boundary = '----BetaUploadBoundary' + Date.now()
    const version = versionPart?.data?.toString() || ''

    // Construct multipart form data manually for the proxy request
    const parts: Buffer[] = []

    // File part
    parts.push(Buffer.from(`--${boundary}\r\n`))
    parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filePart.filename || 'plugin.zip'}"\r\n`))
    parts.push(Buffer.from(`Content-Type: ${filePart.type || 'application/zip'}\r\n\r\n`))
    parts.push(filePart.data)
    parts.push(Buffer.from('\r\n'))

    // End boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`))

    const body = Buffer.concat(parts)

    // Forward to main app
    const headers: Record<string, string> = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'X-Beta-Upload-Key': config.mainAppApiKey || '',
    }

    if (version) {
      headers['X-Beta-Version'] = version
    }

    const response = await fetch(`${mainAppUrl}/api/v2/internal/upload-beta-plugin`, {
      method: 'POST',
      headers,
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Beta upload proxy failed: ${response.status} ${errorText}`)
      throw createError({
        statusCode: response.status,
        message: `Upload failed: ${response.statusText}`,
      })
    }

    const result = await response.json()

    // Audit log the upload
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'beta_plugin_uploaded',
        entity_type: 'plugin_release',
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          version: version || 'unknown',
          filename: filePart.filename,
          size: filePart.data.length,
        }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: new Date().toISOString(),
      })
    } catch (auditError) {
      console.warn('Failed to create audit log for beta upload:', auditError)
    }

    return result
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error proxying beta plugin upload:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to upload beta plugin',
    })
  }
})
