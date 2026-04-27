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
 * Walks the HTTP redirect chain from `inputUrl` with manual HEAD requests,
 * returning the final URL the chain lands on (normalized for storage).
 *
 * Catches drift the connect form can't see from a string: http→https,
 * apex→www, apex→/blog. Caller should pass an already-normalized input.
 *
 * SSRF defenses: hostname is validated against isPrivateOrReservedHost
 * pre-flight and on every redirect target before the next fetch; non-http(s)
 * schemes are rejected; redirect cap of 5; same-apex check on the final URL
 * to prevent parked-domain hijacks.
 *
 * Falls back to the input URL on any failure (network, timeout, redirect cap,
 * cross-apex final, normalization rejection).
 *
 * Known limitation: WP/nginx setups returning 405 to HEAD land here as a
 * non-3xx terminal — we silently store the un-resolved input URL (same as
 * before this function existed). GET fallback on 405 is Phase 2 if needed.
 */
export async function resolveSiteUrl(
  inputUrl: string,
  options?: { allowedDomains?: string[]; timeoutMs?: number },
): Promise<string> {
  const timeoutMs = options?.timeoutMs ?? 5000
  const allowedDomains = options?.allowedDomains

  // Defense in depth: callers today pass an already-normalized input, but a
  // future caller from a different context shouldn't silently bypass the
  // private/reserved-host guard the redirect chain enforces on every hop.
  let initialParsed: URL
  try {
    initialParsed = new URL(inputUrl)
  } catch {
    return inputUrl
  }
  if (initialParsed.protocol !== 'http:' && initialParsed.protocol !== 'https:') {
    return inputUrl
  }
  if (isPrivateOrReservedHost(initialParsed.hostname.toLowerCase(), allowedDomains ?? [])) {
    return inputUrl
  }

  // Same-apex guard. Closes the parked-domain hijack window: if an attacker
  // controls a domain and 301s to parking.example.net, we'd otherwise store
  // the parking URL as canonical. Intermediate hops can leave the apex (URL
  // shorteners, etc.); only the terminal URL must end up on the same apex
  // as the input. Edge case: a customer genuinely moving from oldname.com
  // to newname.com gets rejected and has to re-connect with the new domain
  // — acceptable trade for closing the hijack.
  const inputApex = getApexDomain(inputUrl)
  const finalize = (url: string): string => {
    const normalized = normalizeSiteUrl(url, { allowedDomains })
    if (!normalized) return inputUrl
    if (inputApex && getApexDomain(normalized) !== inputApex) return inputUrl
    return normalized
  }

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
        return finalize(currentUrl)
      }

      const location = response.headers.get('location')
      if (!location) {
        return finalize(currentUrl)
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
 * Extracts the apex domain (lowercased, www. stripped) from a site URL.
 *
 * Used by buildSiteConfig as a fallback when an exact-URL DB match misses —
 * the iframe interactive flow only knows the domain from the creationKey
 * (no protocol, no path), and stored Sites.url commonly includes a path
 * like /blog. Apex matching lets the gating still find the row.
 *
 * Returns null on parse failure or when the host contains any character that
 * can't appear in a registered DNS domain (`[a-z0-9.-]` only). The
 * char-class restriction defends the apex-fallback's `LIKE` query against
 * SQL wildcard injection — `_` is a valid hostname char per the WHATWG URL
 * spec but matches any single char in LIKE, so an attacker-crafted siteKey
 * decoding to `https://example_com` could otherwise hit unrelated rows.
 *
 * Other subdomains are preserved verbatim (only `www.` is stripped) since
 * `blog.example.com` and `shop.example.com` are typically distinct WP installs.
 */
export function getApexDomain(siteUrl: string): string | null {
  try {
    const host = new URL(siteUrl).hostname.toLowerCase()
    const apex = host.startsWith('www.') ? host.slice(4) : host
    if (!/^[a-z0-9.-]+$/.test(apex)) return null
    return apex
  } catch {
    return null
  }
}

/**
 * Builds the URL match patterns the buildSiteConfig apex fallback uses for
 * SQL LIKE lookup. Splits into `exact` (no path) and `prefix` (terminated
 * with `/`, so `LIKE pattern%` only extends into the path).
 *
 * The trailing-slash anchor is load-bearing: without it,
 * `LIKE 'https://example.com%'` would match `https://example.com.evil.com/x`
 * — letting an attacker-controlled row be returned for a victim apex query.
 * `LIKE 'https://example.com/%'` requires a `/` immediately after the apex,
 * so a `.evil.com` extension can't sneak in.
 */
export function buildApexHostMatchPatterns(apex: string): {
  exact: string[]
  prefix: string[]
} {
  const hosts = [apex, `www.${apex}`]
  // http variants included defensively. normalizeSiteUrl enforces https for
  // non-local hosts at connect, but legacy rows from before redirect-following
  // landed may still be http://. Cheap to query, harmless if no rows match.
  const protocols = ['https://', 'http://']
  const exact: string[] = []
  const prefix: string[] = []
  // Loop order produces: apex×https, apex×http, www×https, www×http — used by tests.
  for (const host of hosts) {
    for (const proto of protocols) {
      exact.push(`${proto}${host}`)
      prefix.push(`${proto}${host}/`)
    }
  }
  return { exact, prefix }
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
