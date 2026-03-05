/**
 * POST /api/admin/releases/send-email
 * Trigger batch send of release notes email to subscribers.
 *
 * Request body: { version, product, title, description, highlights, releaseUrl }
 */

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  try {
    const body = await readBody(event)
    const { version, product, title, description, highlights, releaseUrl } = body

    // Validate required fields
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

    // Import from the main app's utils — admin shares the same database
    const { sendReleaseNotesEmail } = await import('../../../../app/server/utils/release-mailer')

    const result = await sendReleaseNotesEmail({
      title,
      version,
      product,
      description,
      highlights: highlights || [],
      releaseUrl: releaseUrl || `https://create.studio/releases/${product}-${version.replace(/\./g, '-')}`,
    })

    return {
      success: true,
      message: `Release email sent to ${result.sent} subscribers`,
      ...result,
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error sending release email:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to send release email',
    })
  }
})
