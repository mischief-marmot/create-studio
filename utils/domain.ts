/**
 * Domain normalization and creation key utilities
 */

/**
 * Normalizes a domain by removing protocol, paths, and www prefix
 * Preserves all subdomains except www
 * 
 * @param url - Full URL or domain string
 * @returns Normalized domain (e.g., "blog.example.com" or "example.com")
 */
export function normalizeDomain(url: string): string {
  try {
    // Handle cases where url might not have protocol
    const urlToProcess = url.includes('://') ? url : `https://${url}`
    const domain = new URL(urlToProcess).hostname
    
    // Remove only www prefix, keep other subdomains
    return domain.replace(/^www\./, '')
  } catch (error) {
    // Fallback for invalid URLs - just clean the string
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }
}

/**
 * Creates a Base64-encoded creation key from domain and creation ID
 * Format: base64(domain:creationId)
 * 
 * @param domain - Domain URL or hostname
 * @param creationId - Unique creation identifier
 * @returns Base64-encoded creation key
 */
export function createCreationKey(domain: string, creationId: string | number): string {
  const normalized = normalizeDomain(domain)
  const keyString = `${normalized}:${creationId}`
  return btoa(keyString)
}

/**
 * Parses a Base64-encoded creation key back to domain and creation ID
 * 
 * @param creationKey - Base64-encoded creation key
 * @returns Object with domain and creationId, or null if invalid
 */
export function parseCreationKey(creationKey: string): { domain: string; creationId: string } | null {
  try {
    const decoded = atob(creationKey)
    const [domain, creationId] = decoded.split(':')
    
    if (!domain || !creationId) {
      return null
    }
    
    return { domain, creationId }
  } catch (error) {
    return null
  }
}

/**
 * Checks if the current domain matches a creation key's domain
 * Useful for validating creation access
 * 
 * @param creationKey - Base64-encoded creation key
 * @param currentDomain - Current domain to check against (defaults to window.location.hostname)
 * @returns Boolean indicating if domains match
 */
export function isCreationKeyValid(creationKey: string, currentDomain?: string): boolean {
  const parsed = parseCreationKey(creationKey)
  if (!parsed) return false
  
  const domain = currentDomain || (typeof window !== 'undefined' ? window.location.hostname : '')
  const normalizedCurrent = normalizeDomain(domain)
  
  return parsed.domain === normalizedCurrent
}