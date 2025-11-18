/**
 * Cookie utility functions for managing browser cookies
 * Only available on client-side (checks process.client)
 */

/**
 * Delete all cookies matching a given regular expression pattern
 * This is useful for clearing groups of related cookies (e.g., all GA cookies)
 *
 * @param pattern - Regular expression to match cookie names against
 * @example
 * // Delete all Google Analytics cookies
 * deleteCookiesByPattern(/^_ga/)
 *
 * @example
 * // Delete all cookies starting with 'tracking_'
 * deleteCookiesByPattern(/^tracking_/)
 */
export function deleteCookiesByPattern(pattern: RegExp): void {
  if (!process.client) return

  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim()
    if (pattern.test(name)) {
      deleteCookie(name)
    }
  })
}

/**
 * Delete a specific cookie by name, attempting multiple domain variations
 * to ensure deletion across different domain scopes
 *
 * @param name - The name of the cookie to delete
 * @param path - The path where the cookie was set (default: '/')
 * @param domain - Optional specific domain to delete from
 */
export function deleteCookie(name: string, path: string = '/', domain?: string) {
  if (!process.client) return

  const expireDate = 'Thu, 01 Jan 1970 00:00:00 GMT'
  const cookieName = `${name}=`
  const pathStr = `path=${path}`
  const expiresStr = `expires=${expireDate}`

  // Try deleting with no domain (current domain)
  document.cookie = `${cookieName};${expiresStr};${pathStr}`

  // If domain specified, try that
  if (domain) {
    document.cookie = `${cookieName};${expiresStr};${pathStr};domain=${domain}`
  }

  // Also try parent domain (e.g., .example.com if current is subdomain.example.com)
  if (process.client && window.location.hostname.includes('.')) {
    const parts = window.location.hostname.split('.')
    // Try parent domains: .example.com, .co.uk, etc.
    for (let i = 1; i < parts.length - 1; i++) {
      const parentDomain = '.' + parts.slice(i).join('.')
      document.cookie = `${cookieName};${expiresStr};${pathStr};domain=${parentDomain}`
    }
  }
}

/**
 * Delete all Google Analytics cookies set by Google Analytics 4 (GA4)
 * Attempts deletion across multiple domain scopes to ensure complete removal
 *
 * Deletes cookies matching patterns:
 * - `_ga*` - Google Analytics unique ID
 * - `_gid` - Google Analytics session ID
 * - `_ga_*` - Google Analytics property ID
 *
 * @example
 * // Delete GA cookies when user rejects analytics consent
 * deleteAnalyticsCookies()
 *
 * @note This function is client-only and will do nothing on server
 * @note Attempts deletion on current domain and parent domains
 */
export function deleteAnalyticsCookies(): void {
  const patterns = [/^_ga/, /^_gid/, /^_ga_/]
  patterns.forEach((pattern) => {
    deleteCookiesByPattern(pattern)
  })
}

/**
 * Cookie options for setting cookies
 * @property maxAge - Cookie lifetime in seconds
 * @property path - Path where cookie is accessible (default: '/')
 * @property domain - Domain scope for cookie (default: current domain)
 * @property secure - Require HTTPS for cookie transmission
 * @property sameSite - CSRF protection level (Strict, Lax, or None)
 */
export interface CookieOptions {
  maxAge?: number
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

/**
 * Get a cookie value by name, properly decoding the value
 * Returns null if cookie doesn't exist or not on client
 *
 * @param name - The name of the cookie to retrieve
 * @returns The decoded cookie value, or null if not found
 *
 * @example
 * const sessionId = getCookie('session_id')
 *
 * @note This function is client-only and will return null on the server
 */
export function getCookie(name: string): string | null {
  if (!process.client) return null

  const nameEQ = `${name}=`
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const trimmed = cookie.trim()
    if (trimmed.startsWith(nameEQ)) {
      return decodeURIComponent(trimmed.substring(nameEQ.length))
    }
  }
  return null
}

/**
 * Set a cookie with optional configuration
 * Properly encodes the value and applies security options
 *
 * @param name - The name of the cookie
 * @param value - The value to store (will be URI-encoded)
 * @param options - Optional cookie configuration (path, domain, secure, sameSite, etc.)
 *
 * @example
 * // Set a simple cookie
 * setCookie('theme', 'dark')
 *
 * @example
 * // Set a secure, HttpOnly-equivalent cookie
 * setCookie('auth_token', token, {
 *   maxAge: 3600, // 1 hour
 *   secure: true,
 *   sameSite: 'Strict',
 *   path: '/'
 * })
 *
 * @note This function is client-only (no-op on server)
 * @note For true HttpOnly cookies, set them from the server
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  if (!process.client) return

  let cookieString = `${name}=${encodeURIComponent(value)}`

  if (options.maxAge) {
    cookieString += `; Max-Age=${options.maxAge}`
  }
  if (options.path) {
    cookieString += `; Path=${options.path}`
  }
  if (options.domain) {
    cookieString += `; Domain=${options.domain}`
  }
  if (options.secure) {
    cookieString += '; Secure'
  }
  if (options.sameSite) {
    cookieString += `; SameSite=${options.sameSite}`
  }

  document.cookie = cookieString
}
