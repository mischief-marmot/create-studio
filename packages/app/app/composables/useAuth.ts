/**
 * Client-side auth utilities for Create Studio
 *
 * Uses session cookies via nuxt-auth-utils instead of JWT tokens
 */

import { useRouter } from 'vue-router'
import { clearSiteContext } from './useSiteContext'

/**
 * Composable for auth-related functionality
 */
export function useAuth() {
  const router = useRouter()
  const { loggedIn, user, session, fetch: fetchSession, clear } = useUserSession()

  const login = async () => {
    // Session is set server-side via setUserSession() in login API
    // Just fetch the session to update client state
    await fetchSession()
  }

  const logout = async () => {
    try {
      // Call logout API to clear session cookie
      await $fetch('/api/v2/auth/logout', {
        method: 'POST'
      })
      // Clear client-side session state
      await clear()
      // Clear site context
      clearSiteContext()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      clearSiteContext()
      router.push('/auth/login')
    }
  }

  const checkSession = async () => {
    await fetchSession()
  }

  return {
    loggedIn,
    user,
    session,
    login,
    logout,
    checkSession
  }
}
