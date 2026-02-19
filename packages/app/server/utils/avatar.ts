/**
 * Avatar utility functions for transforming avatar paths to URLs
 */

/**
 * Transform an avatar path from the database to a fully qualified public URL
 *
 * @param avatar - The avatar path from the database (e.g., 'avatars/1-xxx.png')
 * @returns The fully qualified URL (e.g., 'https://create.studio/avatars/1-xxx.png') or null if no avatar
 */
export function getAvatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) {
    return null
  }

  // If it's already a full URL, return as-is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }

  // Get the root URL from runtime config
  const { public: { rootUrl } } = useRuntimeConfig()

  // If it starts with 'avatars/', transform to /avatars/ route
  if (avatar.startsWith('avatars/')) {
    return `${rootUrl}/avatars/${avatar.replace('avatars/', '')}`
  }

  // Otherwise, prepend root URL
  return `${rootUrl}${avatar.startsWith('/') ? '' : '/'}${avatar}`
}
