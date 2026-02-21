/**
 * Avatar utilities for admin portal
 * Simplified version - only includes functions actually used by admin
 */

import md5 from 'crypto-js/md5'

/**
 * Get Gravatar URL for an email address
 */
export function getGravatarUrl(email: string, size: number = 200): string {
  const hash = md5(email.toLowerCase().trim()).toString()
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}

/**
 * Get user initials from first and last name
 */
export function getUserInitials(firstname?: string, lastname?: string): string {
  const first = firstname?.charAt(0)?.toUpperCase() || ''
  const last = lastname?.charAt(0)?.toUpperCase() || ''
  return first + last || '??'
}
