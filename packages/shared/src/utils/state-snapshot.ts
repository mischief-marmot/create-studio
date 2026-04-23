/**
 * Base64-encode a JSON-serializable snapshot for cross-origin transport via URL params.
 * Used by the Interactive Mode new-tab flow to carry publisher-side localStorage state
 * (servings, unit system, checklist) across the origin boundary to create.studio.
 */
export function encodeStateSnapshot(snapshot: unknown): string {
  const json = JSON.stringify(snapshot)
  const utf8 = new TextEncoder().encode(json)
  let binary = ''
  for (let i = 0; i < utf8.length; i++) {
    binary += String.fromCharCode(utf8[i])
  }
  return btoa(binary)
}

/**
 * Inverse of encodeStateSnapshot. Returns null on any decode failure.
 */
export function decodeStateSnapshot<T>(encoded: string): T | null {
  try {
    const binary = atob(encoded)
    const utf8 = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(utf8)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
