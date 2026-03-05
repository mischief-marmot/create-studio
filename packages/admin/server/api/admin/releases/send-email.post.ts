/**
 * POST /api/admin/releases/send-email
 * Trigger batch send of release notes email to subscribers.
 * Proxies to the main app's internal API which has Vue SFC compilation for email templates.
 *
 * Request body: { version, product, title, description, highlights, releaseUrl, draftId? }
 * If draftId is provided, the draft is marked as sent after successful delivery.
 */

import { eq } from 'drizzle-orm'
import { useAdminOpsDb, releaseEmails } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { draftId, ...emailPayload } = body

  const mainAppUrl = config.mainAppUrl || 'http://localhost:3000'

  try {
    const result = await $fetch('/api/v2/internal/send-release-email', {
      baseURL: mainAppUrl,
      method: 'POST',
      headers: {
        'X-Admin-Api-Key': config.mainAppApiKey || '',
      },
      body: emailPayload,
    })

    // Mark draft as sent if draftId was provided
    if (draftId) {
      try {
        const db = useAdminOpsDb(event)
        await db
          .update(releaseEmails)
          .set({
            status: 'sent',
            sentAt: new Date().toISOString(),
            sentBy: session.user.id,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(releaseEmails.id, Number(draftId)))
      }
      catch (dbErr) {
        console.warn('Failed to mark draft as sent:', dbErr)
      }
    }

    return result
  }
  catch (error: any) {
    const statusCode = error?.response?.status || error?.statusCode || 500
    const message = error?.data?.message || error?.message || 'Failed to send release email'

    console.error('Error sending release email:', message)
    throw createError({ statusCode, message })
  }
})
