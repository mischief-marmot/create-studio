/**
 * URL Validation and Normalization Utility
 *
 * Provides functions for validating and normalizing WordPress site URLs
 * used in the site connection flow.
 */

/**
 * Parses the allowedTestDomains runtime config string into an array.
 * @param configValue - Comma-separated string of domain patterns (e.g., ".local,.test")
 * @returns Array of domain patterns
 */
export function parseAllowedTestDomains(configValue: string | undefined): string[] {
  if (!configValue) return []
  return configValue.split(',').map(d => d.trim()).filter(Boolean)
}

/**
 * Checks if a hostname matches any of the allowed test domain patterns.
 * Patterns can be exact matches or suffix matches (starting with .)
 * Example patterns: ".local", ".test", "mysite.local"
 */
function isAllowedTestDomain(hostname: string, allowedDomains: string[]): boolean {
  return allowedDomains.some(pattern => {
    if (pattern.startsWith('.')) {
      // Suffix match (e.g., ".local" matches "mysite.local")
      return hostname.endsWith(pattern)
    }
    // Exact match
    return hostname === pattern
  })
}

/**
 * Checks if a hostname is private, reserved, or potentially malicious.
 * @param hostname - The hostname to check
 * @param allowedDomains - Optional list of domain patterns to allow even in production
 */
function isPrivateOrReservedHost(hostname: string, allowedDomains: string[] = []): boolean {
  // Check if hostname is in the allowlist (bypass all other checks)
  if (allowedDomains.length > 0 && isAllowedTestDomain(hostname, allowedDomains)) {
    return false
  }

  const isProduction = import.meta.prod ?? process.env.NODE_ENV === 'production'

  // Block localhost variants in production
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return isProduction
  }

  // Block private IP ranges
  const ipv4Private = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/
  if (ipv4Private.test(hostname)) {
    return true
  }

  // Block link-local and reserved in production
  if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.test')) {
    return isProduction
  }

  return false
}

/**
 * Normalizes and validates a WordPress site URL for storage and comparison.
 * Returns null if the URL is invalid or not allowed.
 *
 * @param input - The URL string to normalize
 * @param options - Optional configuration
 * @param options.allowedDomains - Domain patterns to allow (e.g., [".local", ".test"])
 * @returns The normalized URL string, or null if invalid
 */
export function normalizeSiteUrl(input: string, options?: { allowedDomains?: string[] }): string | null {
  const allowedDomains = options?.allowedDomains || []

  try {
    // Parse the URL
    const url = new URL(input.trim())
    const hostname = url.hostname.toLowerCase()

    // Check if this is an explicitly allowed test domain
    const isAllowed = allowedDomains.length > 0 && isAllowedTestDomain(hostname, allowedDomains)

    // Determine if this is a local/development host
    const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith('.local') || url.hostname.endsWith('.test') || isAllowed

    // Enforce HTTPS (required for secure plugin communication)
    if (url.protocol !== 'https:') {
      // Allow http for local/development domains
      if (!isLocalHost) {
        return null // Reject non-HTTPS URLs
      }
    }

    // Force HTTP for local hosts (they typically don't have valid SSL)
    if (isLocalHost && url.protocol === 'https:') {
      url.protocol = 'http:'
    }

    // Block private/internal IP ranges (security)
    if (isPrivateOrReservedHost(hostname, allowedDomains)) {
      return null
    }

    // Normalize: lowercase hostname
    url.hostname = url.hostname.toLowerCase()

    // Normalize: remove default ports
    if ((url.protocol === 'https:' && url.port === '443') ||
        (url.protocol === 'http:' && url.port === '80')) {
      url.port = ''
    }

    // Normalize: remove trailing slash from path
    url.pathname = url.pathname.replace(/\/+$/, '') || '/'

    // Normalize: remove hash and search params (not part of site identity)
    url.hash = ''
    url.search = ''

    // Return normalized URL without trailing slash
    const normalized = url.origin + (url.pathname === '/' ? '' : url.pathname)

    return normalized
  }
  catch {
    return null // Invalid URL
  }
}

const MAX_REDIRECTS = 5

/**
 * Walks the HTTP redirect chain from `inputUrl` manually with HEAD requests,
 * validating each hop's hostname against `isPrivateOrReservedHost` BEFORE
 * issuing the next request. This prevents SSRF where an attacker-controlled
 * domain serves a 301 to an internal address (RFC1918, link-local, metadata
 * endpoints) that the Worker would otherwise probe under `redirect: 'follow'`.
 *
 * Catches drift the connect form can't see from a string alone:
 *   - http→https upgrades the host enforces
 *   - apex→www redirects
 *   - apex→subdirectory redirects (e.g. example.com → example.com/blog)
 *
 * Intermediate hops are allowed to be http (the chain commonly hops through
 * http on the way to https). Only the final URL is validated against
 * `normalizeSiteUrl` for storage — which enforces https for non-local hosts.
 *
 * Falls back to the input URL on any failure (network, timeout, redirect cap,
 * mid-chain validation rejecting a hop, final URL rejected by normalization).
 * Caller should pass an already-normalized input.
 *
 * Known limitation: some WP/nginx setups return 405 to HEAD. Those land here
 * as a non-3xx terminal status, so we silently store the un-resolved input
 * URL — same outcome as before this function existed. A GET fallback on 405
 * is Phase 2 if it bites real customers.
 */
export async function resolveSiteUrl(
  inputUrl: string,
  options?: { allowedDomains?: string[]; timeoutMs?: number },
): Promise<string> {
  const timeoutMs = options?.timeoutMs ?? 5000
  const allowedDomains = options?.allowedDomains
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    let currentUrl = inputUrl
    for (let i = 0; i < MAX_REDIRECTS; i++) {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
      })

      const isRedirect = response.status >= 300 && response.status < 400
      if (!isRedirect) {
        // Terminal response. Validate the URL we landed on for storage.
        const normalized = normalizeSiteUrl(currentUrl, { allowedDomains })
        return normalized || inputUrl
      }

      const location = response.headers.get('location')
      if (!location) {
        const normalized = normalizeSiteUrl(currentUrl, { allowedDomains })
        return normalized || inputUrl
      }

      let nextUrl: string
      try {
        nextUrl = new URL(location, currentUrl).toString()
      } catch {
        return inputUrl
      }

      // Mid-chain SSRF defense. Re-validate the next hop's hostname against
      // private/reserved ranges before fetching it. http→https intermediates
      // are allowed (real chains commonly look like
      // https://apex → http://www.host/path → https://www.host/path).
      let nextParsed: URL
      try {
        nextParsed = new URL(nextUrl)
      } catch {
        return inputUrl
      }
      if (
        nextParsed.protocol !== 'http:' && nextParsed.protocol !== 'https:'
      ) {
        return inputUrl
      }
      if (isPrivateOrReservedHost(nextParsed.hostname.toLowerCase(), allowedDomains ?? [])) {
        return inputUrl
      }

      currentUrl = nextUrl
    }
    // Hit the redirect cap — caller intent is unclear; refuse to store.
    return inputUrl
  } catch {
    return inputUrl
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Validates that a URL looks like a WordPress site.
 * Does not make network requests - just validates format.
 *
 * @param url - The URL string to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidWordPressSiteUrl(url: string, options?: { allowedDomains?: string[] }): boolean {
  const normalized = normalizeSiteUrl(url, options)
  if (!normalized) return false

  // Must have a valid TLD (or be localhost/allowed test domain in dev)
  const parsed = new URL(normalized)
  const hostname = parsed.hostname

  // Basic TLD check (has at least one dot, or is localhost)
  if (!hostname.includes('.') && hostname !== 'localhost') {
    return false
  }

  return true
}
