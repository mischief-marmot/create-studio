<template>
  <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
        {{ props.title || 'Admin Activity' }}
      </h3>
      <NuxtLink
        :to="fullAuditLogLink"
        class="text-xs font-medium text-base-content/50 hover:text-primary transition-colors"
      >
        View All
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-sm text-base-content/40"></span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="py-8 text-center">
      <p class="text-sm text-base-content/50">Failed to load activity</p>
      <button class="text-xs text-primary hover:underline mt-1" @click="fetchLogs">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="logs.length === 0" class="py-8 text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-base-200 text-base-content/30 mb-3">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-sm text-base-content/50">No admin activity recorded</p>
    </div>

    <!-- Timeline -->
    <div v-else class="space-y-0">
      <div
        v-for="(log, index) in logs"
        :key="log.id"
        class="relative pl-6"
        :class="{ 'pb-5': index < logs.length - 1 }"
      >
        <!-- Timeline line -->
        <div
          v-if="index < logs.length - 1"
          class="absolute left-[7px] top-[18px] bottom-0 w-px bg-base-300/50"
        ></div>

        <!-- Timeline dot -->
        <div
          class="absolute left-0 top-[6px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center"
          :class="getActionDotClass(log.action)"
        >
          <div class="w-[5px] h-[5px] rounded-full" :class="getActionDotInnerClass(log.action)"></div>
        </div>

        <!-- Content -->
        <div class="min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <span class="text-sm font-medium text-base-content">{{ formatAction(log.action) }}</span>
              <span class="text-sm text-base-content/50"> by </span>
              <span class="text-sm text-base-content/70">{{ log.adminName }}</span>
            </div>
            <span class="text-xs text-base-content/40 whitespace-nowrap flex-shrink-0">{{ formatRelativeTime(log.createdAt) }}</span>
          </div>

          <!-- Changes summary -->
          <div v-if="log.changes" class="mt-1.5">
            <div
              v-if="log.changes.before && log.changes.after"
              class="text-xs text-base-content/50 space-y-0.5"
            >
              <div v-for="(value, key) in log.changes.after" :key="key" class="flex items-center gap-1">
                <span class="font-medium text-base-content/60">{{ formatChangeKey(key as string) }}:</span>
                <span v-if="log.changes.before[key] !== undefined" class="line-through text-base-content/30">{{ log.changes.before[key] }}</span>
                <span v-if="log.changes.before[key] !== undefined" class="text-base-content/30">&rarr;</span>
                <span class="text-base-content/60">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Show more link -->
      <div v-if="total > limit" class="pt-4 mt-2 border-t border-base-300/30">
        <NuxtLink
          :to="fullAuditLogLink"
          class="flex items-center justify-center gap-2 py-2 text-sm font-medium text-base-content/50 hover:text-primary transition-colors"
        >
          <span>{{ total - logs.length }} more {{ total - logs.length === 1 ? 'entry' : 'entries' }}</span>
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface AuditLog {
  id: number
  admin_id: number
  adminName: string
  adminEmail: string
  action: string
  entity_type: string
  entity_id: number | null
  changes: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  createdAt: string
}

const props = defineProps<{
  entityType: string
  entityId: number
  limit?: number
  title?: string
}>()

const limit = computed(() => props.limit || 5)

const logs = ref<AuditLog[]>([])
const total = ref(0)
const loading = ref(true)
const fetchError = ref(false)

const fullAuditLogLink = computed(() => {
  return `/audit-logs?entity_type=${props.entityType}&entity_id=${props.entityId}`
})

const fetchLogs = async () => {
  loading.value = true
  fetchError.value = false

  try {
    const response = await $fetch<{ data: AuditLog[]; pagination: { total: number } }>(
      `/api/admin/audit-logs`, {
        params: {
          entity_type: props.entityType,
          entity_id: props.entityId,
          limit: limit.value,
          page: 1,
        },
      }
    )
    logs.value = response.data
    total.value = response.pagination.total
  } catch (err) {
    console.error('Failed to fetch audit logs:', err)
    fetchError.value = true
  } finally {
    loading.value = false
  }
}

const formatAction = (action: string): string => {
  const actionMap: Record<string, string> = {
    'user_updated': 'User updated',
    'user_created': 'User created',
    'user_deleted': 'User deleted',
    'user_password_reset': 'Password reset',
    'user_verification_sent': 'Verification sent',
    'user_email_verified': 'Email verified',
    'user_status_toggled': 'Status toggled',
    'site_updated': 'Site updated',
    'site_created': 'Site created',
    'site_deleted': 'Site deleted',
    'site_user_added': 'User added',
    'site_user_removed': 'User removed',
    'site_user_role_changed': 'Role changed',
    'site_user_verified': 'User verified',
    'subscription_created': 'Subscription created',
    'subscription_updated': 'Subscription updated',
    'subscription_canceled': 'Subscription canceled',
    'subscription_deleted': 'Subscription deleted',
    'subscription_tier_modified': 'Tier modified',
    'environment_switched': 'Environment switched',
  }
  return actionMap[action] || action.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

const formatChangeKey = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

const getActionDotClass = (action: string): string => {
  if (action.includes('delete') || action.includes('remove')) {
    return 'border-error/40 bg-error/5'
  }
  if (action.includes('create') || action.includes('add') || action.includes('verified')) {
    return 'border-success/40 bg-success/5'
  }
  if (action.includes('cancel')) {
    return 'border-warning/40 bg-warning/5'
  }
  return 'border-base-300 bg-base-100'
}

const getActionDotInnerClass = (action: string): string => {
  if (action.includes('delete') || action.includes('remove')) {
    return 'bg-error/60'
  }
  if (action.includes('create') || action.includes('add') || action.includes('verified')) {
    return 'bg-success/60'
  }
  if (action.includes('cancel')) {
    return 'bg-warning/60'
  }
  return 'bg-base-content/30'
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

watch(() => [props.entityType, props.entityId], () => {
  fetchLogs()
})

onMounted(() => {
  fetchLogs()
})
</script>
