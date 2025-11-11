/**
 * Cookie utility functions for managing browser cookies
 */

/**
 * Delete cookies matching a pattern
 */
export function deleteCookiesByPattern(pattern: RegExp) {
  if (!process.client) return

  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim()
    if (pattern.test(name)) {
      deleteCookie(name)
    }
  })
}

/**
 * Delete a specific cookie
 */
export function deleteCookie(name: string, path: string = '/') {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`
}

/**
 * Delete all Google Analytics cookies
 */
export function deleteAnalyticsCookies() {
  const patterns = [/^_ga/, /^_gid/, /^_ga_/]
  patterns.forEach((pattern) => {
    deleteCookiesByPattern(pattern)
  })
}

/**
 * Get a cookie value by name
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
 * Set a cookie with options
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number
    path?: string
    domain?: string
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  } = {},
) {
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
