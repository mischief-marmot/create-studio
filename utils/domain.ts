/**
 * Domain normalization and recipe key utilities
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
 * Creates a Base64-encoded recipe key from domain and creation ID
 * Format: base64(domain:creationId)
 * 
 * @param domain - Domain URL or hostname
 * @param creationId - Unique creation identifier
 * @returns Base64-encoded recipe key
 */
export function createRecipeKey(domain: string, creationId: string | number): string {
  const normalized = normalizeDomain(domain)
  const keyString = `${normalized}:${creationId}`
  return btoa(keyString)
}

/**
 * Parses a Base64-encoded recipe key back to domain and creation ID
 * 
 * @param recipeKey - Base64-encoded recipe key
 * @returns Object with domain and creationId, or null if invalid
 */
export function parseRecipeKey(recipeKey: string): { domain: string; creationId: string } | null {
  try {
    const decoded = atob(recipeKey)
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
 * Checks if the current domain matches a recipe key's domain
 * Useful for validating recipe access
 * 
 * @param recipeKey - Base64-encoded recipe key
 * @param currentDomain - Current domain to check against (defaults to window.location.hostname)
 * @returns Boolean indicating if domains match
 */
export function isRecipeKeyValid(recipeKey: string, currentDomain?: string): boolean {
  const parsed = parseRecipeKey(recipeKey)
  if (!parsed) return false
  
  const domain = currentDomain || (typeof window !== 'undefined' ? window.location.hostname : '')
  const normalizedCurrent = normalizeDomain(domain)
  
  return parsed.domain === normalizedCurrent
}