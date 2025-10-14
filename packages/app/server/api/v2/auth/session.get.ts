/**
 * GET /api/v2/auth/session
 * Get current user session
 *
 * Response: { user: { id, email, validEmail } } | { user: null }
 */

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  return {
    user: session.user || null
  }
})
