/**
 * POST /api/v2/auth/logout
 * Logout user by clearing session
 *
 * Response: { success: boolean }
 */

export default defineEventHandler(async (event) => {
  await clearUserSession(event)

  return {
    success: true
  }
})
