/**
 * Authenticated fetch composable
 *
 * Works with session cookies - no need to manually include auth headers
 * Sessions are handled automatically by nuxt-auth-utils
 */

import type { UseFetchOptions } from 'nuxt/app'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Wrapper around $fetch for authenticated requests
 * Sessions are automatically included via cookies
 */
export async function useAuthFetch<T = any>(
  url: string,
  options: {
    method?: HttpMethod
    body?: any
    query?: Record<string, any>
  } = {}
): Promise<T> {
  return await $fetch<T>(url, {
    ...options,
    // Credentials ensure cookies are sent
    credentials: 'include'
  })
}

/**
 * Composable version using useFetch for auto-reactivity
 * Sessions are automatically included via cookies
 */
export function useAuthUseFetch<T = any>(
  url: string | (() => string),
  options: UseFetchOptions<T> = {}
) {
  return useFetch<T>(url, {
    ...options,
    // Credentials ensure cookies are sent
    credentials: 'include'
  })
}
