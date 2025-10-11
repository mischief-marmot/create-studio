/**
 * Generate and persist an anonymous user ID for timer tracking
 * Uses localStorage to persist across sessions
 */

const USER_ID_KEY = 'create-studio-user-id'

/**
 * Generate a random UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Get or create anonymous user ID
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'server-side'
  }

  try {
    // Try to get existing ID from localStorage
    let userId = localStorage.getItem(USER_ID_KEY)

    if (!userId) {
      // Generate new ID
      userId = generateUUID()
      localStorage.setItem(USER_ID_KEY, userId)
    }

    return userId
  } catch (error) {
    // Fallback if localStorage is unavailable (private browsing, etc.)
    console.warn('[UserID] localStorage unavailable, using session ID')
    return `session-${generateUUID()}`
  }
}
