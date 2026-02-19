import { eq, like } from 'drizzle-orm'
import { users } from "~~/server/utils/admin-db"

/**
 * GET /api/admin/users/search
 * Search users by email or ID for the add user modal
 *
 * Query params:
 * - q: string (search query)
 * - mode: 'email' | 'id' (search mode, default: 'email')
 *
 * Returns:
 * - Array of matching users (id, email, firstname, lastname)
 * - Limited to 10 results
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
    // Get query parameters
    const query = getQuery(event)
    const q = (query.q as string || '').trim()
    const mode = (query.mode as string || 'email') === 'id' ? 'id' : 'email'

    // Validate minimum query length (1 for ID, 2 for email)
    const minLength = mode === 'id' ? 1 : 2
    if (q.length < minLength) {
      throw createError({
        statusCode: 400,
        message: `Search query must be at least ${minLength} character${minLength > 1 ? 's' : ''}`,
      })
    }

    let matchingUsers
    if (mode === 'id') {
      const numericId = parseInt(q)
      if (isNaN(numericId)) {
        return []
      }
      matchingUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstname: users.firstname,
          lastname: users.lastname,
        })
        .from(users)
        .where(eq(users.id, numericId))
        .limit(1)
    } else {
      const searchPattern = `%${q.toLowerCase()}%`
      matchingUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstname: users.firstname,
          lastname: users.lastname,
        })
        .from(users)
        .where(like(users.email, searchPattern))
        .limit(10)
    }

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
