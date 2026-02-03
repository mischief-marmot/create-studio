<template>
  <span
    class="admin-badge"
    :class="badgeClass"
    :role="role"
    :aria-label="ariaLabel"
  >
    <span v-if="showDot" class="size-1.5 rounded-full" :class="dotClass" aria-hidden="true"></span>
    <span>{{ displayText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type BadgeVariant = 'tier' | 'status' | 'role'
type TierStatus = 'free' | 'basic' | 'professional' | 'enterprise'
type SiteStatus = 'active' | 'pending' | 'suspended' | 'inactive'
type RoleStatus = 'admin' | 'moderator' | 'user' | 'guest'
type GenericStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface Props {
  status: TierStatus | SiteStatus | RoleStatus | GenericStatus | string
  variant?: BadgeVariant
  showDot?: boolean
  customText?: string
  role?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'status',
  showDot: true,
  customText: '',
  role: 'status',
  ariaLabel: '',
})

// Tier badge styling
const tierStyles: Record<string, string> = {
  free: 'admin-badge-neutral',
  basic: 'admin-badge-info',
  professional: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  enterprise: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}

// Status badge styling
const statusStyles: Record<string, string> = {
  active: 'admin-badge-success',
  verified: 'admin-badge-success',
  success: 'admin-badge-success',
  pending: 'admin-badge-warning',
  warning: 'admin-badge-warning',
  suspended: 'admin-badge-error',
  inactive: 'admin-badge-neutral',
  error: 'admin-badge-error',
  info: 'admin-badge-info',
  neutral: 'admin-badge-neutral',
}

// Role badge styling
const roleStyles: Record<string, string> = {
  admin: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  moderator: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  user: 'admin-badge-neutral',
  guest: 'admin-badge-neutral',
}

const badgeClass = computed(() => {
  const status = props.status.toLowerCase()

  if (props.variant === 'tier') {
    return tierStyles[status] || 'admin-badge-neutral'
  }

  if (props.variant === 'role') {
    return roleStyles[status] || 'admin-badge-neutral'
  }

  // Default to status variant
  return statusStyles[status] || 'admin-badge-neutral'
})

const dotClass = computed(() => {
  const status = props.status.toLowerCase()

  if (props.variant === 'tier') {
    const dotColors: Record<string, string> = {
      free: 'bg-base-content/70',
      basic: 'bg-info',
      professional: 'bg-purple-500',
      enterprise: 'bg-amber-500',
    }
    return dotColors[status] || 'bg-base-content/70'
  }

  if (props.variant === 'role') {
    const dotColors: Record<string, string> = {
      admin: 'bg-rose-500',
      moderator: 'bg-blue-500',
      user: 'bg-base-content/70',
      guest: 'bg-base-content/70',
    }
    return dotColors[status] || 'bg-base-content/70'
  }

  // Status dot colors
  const dotColors: Record<string, string> = {
    active: 'bg-success',
    verified: 'bg-success',
    success: 'bg-success',
    pending: 'bg-warning',
    warning: 'bg-warning',
    suspended: 'bg-error',
    inactive: 'bg-base-content/70',
    error: 'bg-error',
    info: 'bg-info',
    neutral: 'bg-base-content/70',
  }
  return dotColors[status] || 'bg-base-content/70'
})

const displayText = computed(() => {
  if (props.customText) {
    return props.customText
  }

  // Capitalize first letter
  return props.status.charAt(0).toUpperCase() + props.status.slice(1).toLowerCase()
})
</script>
