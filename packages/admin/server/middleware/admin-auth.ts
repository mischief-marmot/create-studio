/**
 * Admin authentication middleware
 * Protects admin routes by checking session and redirecting unauthenticated users to /login
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Skip auth check for login page and auth API endpoints
  const publicPaths = [
    '/login',
    '/api/admin/auth/login',
    '/api/admin/auth/session',
  ]

  // Skip if path is in public paths
  if (publicPaths.some((publicPath) => path.startsWith(publicPath))) {
    return
  }

  // Check session
  const session = await getUserSession(event)

  if (!session?.user) {
    // Redirect to login for page requests
    if (!path.startsWith('/api/')) {
      return sendRedirect(event, '/login')
    }

    // Return 401 for API requests
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  // User is authenticated, continue
})
