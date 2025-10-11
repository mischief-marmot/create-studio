/**
 * Auth middleware for protected routes
 * Checks if user has a valid session
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }
})
