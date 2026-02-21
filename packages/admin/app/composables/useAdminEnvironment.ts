import { readonly } from 'vue'

/**
 * Admin environment type
 */
export type AdminEnvironment = 'production' | 'preview'

/**
 * Environment API response type
 */
interface EnvironmentResponse {
  environment: AdminEnvironment
  availableEnvironments: string[]
  isLocal: boolean
}

/**
 * Admin environment composable
 * Provides environment detection and switching for admin portal
 *
 * Uses useCookie to read initial state for SSR hydration consistency
 */
export const useAdminEnvironment = () => {
  // Read environment from cookie for SSR consistency
  // This ensures server and client render the same initial value
  const envCookie = useCookie<AdminEnvironment>('admin_environment', {
    default: () => 'production',
  })

  // Use useState for SSR-safe state that persists across hydration
  const environment = useState<AdminEnvironment>('admin-environment', () => envCookie.value || 'production')
  const availableEnvironments = useState<string[]>('admin-available-environments', () => ['production', 'preview'])
  const isLoading = useState('admin-env-loading', () => false)
  const error = useState<string | null>('admin-env-error', () => null)
  const isLocal = useState('admin-env-is-local', () => false)

  /**
   * Fetch current environment from server
   */
  const fetchEnvironment = async (): Promise<void> => {
    try {
      const data = await $fetch<EnvironmentResponse>('/api/admin/environment')
      environment.value = data.environment
      availableEnvironments.value = data.availableEnvironments
      isLocal.value = data.isLocal
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch environment'
      console.error('Failed to fetch environment:', e)
    }
  }

  /**
   * Switch to a different environment
   * Reloads the page after switching to refresh all data
   */
  const switchEnvironment = async (env: AdminEnvironment): Promise<void> => {
    if (env === environment.value) return

    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<EnvironmentResponse>('/api/admin/environment', {
        method: 'POST',
        body: { environment: env },
      })
      environment.value = data.environment
      // Refresh the page to reload all data with new environment
      window.location.reload()
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to switch environment'
      console.error('Failed to switch environment:', e)
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
    environment: readonly(environment),
    availableEnvironments: readonly(availableEnvironments),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isLocal: readonly(isLocal),

    // Methods
    fetchEnvironment,
    switchEnvironment,
    clearError,
  }
}
