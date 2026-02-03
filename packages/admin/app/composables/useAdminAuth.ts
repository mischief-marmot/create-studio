import { ref, computed, readonly } from 'vue'

/**
 * Admin user type
 */
export interface AdminUser {
  id: number
  email: string
  role: string
  firstname?: string | null
  lastname?: string | null
}

/**
 * Session response type
 */
interface SessionResponse {
  authenticated: boolean
  user: AdminUser | null
}

/**
 * Admin authentication composable
 * Provides login, logout, and session management for admin users
 */
export const useAdminAuth = () => {
  const adminUser = ref<AdminUser | null>(null)
  const isAuthenticated = computed(() => !!adminUser.value)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<AdminUser>('/api/admin/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      adminUser.value = response
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Login failed'
      adminUser.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout current admin user
   */
  const logout = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      await $fetch('/api/admin/auth/logout', {
        method: 'POST',
      })

      adminUser.value = null

      // Redirect to login page
      await navigateTo('/login')
    } catch (err: any) {
      error.value = err.data?.message || 'Logout failed'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch current session
   */
  const fetchSession = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<SessionResponse>('/api/admin/auth/session')

      if (response.authenticated && response.user) {
        adminUser.value = response.user
      } else {
        adminUser.value = null
      }
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch session'
      adminUser.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    adminUser: readonly(adminUser),
    isAuthenticated,
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    login,
    logout,
    fetchSession,
    clearError,
  }
}
