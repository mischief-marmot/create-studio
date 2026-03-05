/**
 * POST /api/v2/internal/send-release-email
 * Internal endpoint for admin to trigger release notes email.
 *
 * Auth: X-Admin-Api-Key header (shared secret between admin and main app)
 *
 * Body: { version, product, title, description, highlights, releaseUrl }
 */

import { sendReleaseNotesEmail } from '~~/server/utils/release-mailer'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const adminApiKey = getHeader(event, 'X-Admin-Api-Key')
  if (!adminApiKey || !config.adminApiKey || adminApiKey !== config.adminApiKey) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { version, product, title, description, heroImageUrl, highlights, releaseUrl } = body

  if (!version || !product || !title || !description) {
    throw createError({
      statusCode: 400,
      message: 'version, product, title, and description are required',
    })
  }

  if (!['create-plugin', 'create-studio'].includes(product)) {
    throw createError({
      statusCode: 400,
      message: 'product must be "create-plugin" or "create-studio"',
    })
  }

  const result = await sendReleaseNotesEmail({
    title,
    version,
    product,
    description,
    heroImageUrl: heroImageUrl || undefined,
    highlights: highlights || [],
    releaseUrl: releaseUrl || `https://create.studio/releases/${product}-${version.replace(/\./g, '-')}`,
  })

  return {
    success: true,
    message: `Release email sent to ${result.sent} subscribers`,
    ...result,
  }
})
