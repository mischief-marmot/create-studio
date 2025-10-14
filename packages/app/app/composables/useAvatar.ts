/**
 * Avatar composable with three-tier fallback system:
 * 1. Stored avatar (NuxtHub blob storage)
 * 2. Gravatar (based on email)
 * 3. DaisyUI placeholder (initials)
 */

import md5 from 'crypto-js/md5'

export interface AvatarOptions {
  email?: string
  firstname?: string
  lastname?: string
  avatar?: string
  size?: number
}

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

/**
 * Check if Gravatar exists for email
 */
export async function checkGravatarExists(email: string): Promise<boolean> {
  try {
    const url = getGravatarUrl(email, 80)
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get avatar URL with three-tier fallback
 */
export function useAvatar(options: AvatarOptions) {
  const avatarUrl = ref<string | null>(null)
  const avatarType = ref<'stored' | 'gravatar' | 'placeholder'>('placeholder')
  const initials = computed(() => getUserInitials(options.firstname, options.lastname))
  const loading = ref(true)

  /**
   * Load avatar with fallback logic
   */
  const loadAvatar = async () => {
    loading.value = true

    // 1. Try stored avatar first
    if (options.avatar) {
      // If avatar starts with 'avatars/', it's a blob storage path
      if (options.avatar.startsWith('avatars/')) {
        avatarUrl.value = `/api/_hub/blob/${options.avatar}`
        avatarType.value = 'stored'
        loading.value = false
        return
      }
      // Otherwise, treat it as a full URL
      avatarUrl.value = options.avatar
      avatarType.value = 'stored'
      loading.value = false
      return
    }

    // 2. Try Gravatar if email is provided
    if (options.email) {
      const gravatarExists = await checkGravatarExists(options.email)
      if (gravatarExists) {
        avatarUrl.value = getGravatarUrl(options.email, options.size || 200)
        avatarType.value = 'gravatar'
        loading.value = false
        return
      }
    }

    // 3. Fall back to placeholder
    avatarUrl.value = null
    avatarType.value = 'placeholder'
    loading.value = false
  }

  /**
   * Update avatar when options change
   */
  watch(
    () => [options.avatar, options.email, options.firstname, options.lastname],
    () => {
      loadAvatar()
    },
    { immediate: true }
  )

  /**
   * Upload new avatar file
   */
  const uploadAvatar = async (file: File): Promise<{ success: boolean; error?: string; url?: string }> => {
    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload to API
      const response = await $fetch<{ success: boolean; error?: string; avatar?: string; url?: string }>(
        '/api/v2/users/avatar',
        {
          method: 'POST',
          body: formData
        }
      )

      if (response.success && response.avatar) {
        // Update local state
        options.avatar = response.avatar
        avatarUrl.value = response.url || `/api/_hub/blob/${response.avatar}`
        avatarType.value = 'stored'
        return { success: true, url: avatarUrl.value }
      }

      return { success: false, error: response.error || 'Upload failed' }
    } catch (error: any) {
      return { success: false, error: error.message || 'Upload failed' }
    }
  }

  /**
   * Delete stored avatar
   */
  const deleteAvatar = async (): Promise<{ success: boolean; error?: string }> => {
    if (!options.avatar || !options.avatar.startsWith('avatars/')) {
      return { success: false, error: 'No stored avatar to delete' }
    }

    try {
      // Update user to remove avatar
      const session = await $fetch('/api/v2/auth/session')
      if (!session.user?.id) {
        return { success: false, error: 'Not authenticated' }
      }

      await $fetch(`/api/v2/users/${session.user.id}`, {
        method: 'PATCH',
        body: { avatar: '' }
      })

      // Update local state
      options.avatar = undefined
      await loadAvatar()

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Delete failed' }
    }
  }

  return {
    avatarUrl,
    avatarType,
    initials,
    loading,
    loadAvatar,
    uploadAvatar,
    deleteAvatar
  }
}
