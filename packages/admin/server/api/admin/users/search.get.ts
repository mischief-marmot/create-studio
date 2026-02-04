import { like } from 'drizzle-orm'
import { users } from "~~/server/utils/db"

/**
 * GET /api/admin/users/search
 * Search users by email for the add user modal
 *
 * Query params:
 * - q: string (search query, minimum 2 characters)
 *
 * Returns:
 * - Array of matching users (id, email, firstname, lastname)
 * - Limited to 10 results
 * - Case-insensitive LIKE query on email
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

  try {
    // Get query parameter
    const query = getQuery(event)
    const q = (query.q as string || '').trim()

    // Validate minimum query length
    if (q.length < 2) {
      throw createError({
        statusCode: 400,
        message: 'Search query must be at least 2 characters',
      })
    }

    // Search users by email (case-insensitive LIKE)
    const searchPattern = `%${q.toLowerCase()}%`
    const matchingUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
      })
      .from(users)
      .where(like(users.email, searchPattern))
      .limit(10)

    return matchingUsers
  } catch (error) {
    // Re-throw HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error searching users:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to search users',
    })
  }
})
