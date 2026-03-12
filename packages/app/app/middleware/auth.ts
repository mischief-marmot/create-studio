/**
 * Auth middleware for protected routes
 * Checks if user has a valid session
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }
})
