<template>
  <div class="dropdown dropdown-end">
    <button
      tabindex="0"
      class="btn btn-ghost btn-sm gap-2"
      :disabled="isLoading"
      :aria-label="`Current environment: ${getLabel(environment)}. Click to change.`"
    >
      <span v-if="isLoading" class="loading loading-spinner loading-xs"></span>
      <span v-else class="size-2 rounded-full" :class="getDotClass(environment)"></span>
      <span class="hidden sm:inline">{{ getLabel(environment) }}</span>
      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <ul
      tabindex="0"
      class="dropdown-content menu bg-base-200 rounded-box z-50 w-48 p-2 shadow-lg border border-base-300"
    >
      <li v-for="env in availableEnvironments" :key="env">
        <button
          @click="handleSwitch(env as 'production' | 'preview')"
          :class="{ 'active': env === environment }"
          class="flex items-center gap-2"
        >
          <span class="size-2 rounded-full" :class="getDotClass(env)"></span>
          {{ getLabel(env) }}
        </button>
      </li>
    </ul>
  </div>

  <!-- Confirmation Modal for switching to Production -->
  <AdminModal
    :open="showConfirmModal"
    title="Switch to Production?"
    description="You are about to switch to the production environment. Changes made here will affect live data."
    variant="warning"
    confirm-text="Switch to Production"
    cancel-text="Cancel"
    :loading="isLoading"
    loading-text="Switching..."
    @confirm="confirmSwitch"
    @cancel="cancelSwitch"
    @close="cancelSwitch"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const {
  environment,
  availableEnvironments,
  isLoading,
  switchEnvironment,
  isLocal,
} = useAdminEnvironment()

const showConfirmModal = ref(false)
const pendingEnvironment = ref<'production' | 'preview' | null>(null)

/**
 * Handle environment switch request
 * Shows confirmation modal when switching TO production
 */
function handleSwitch(env: 'production' | 'preview') {
  if (env === environment.value) return

  // Confirm when switching TO production
  if (env === 'production') {
    pendingEnvironment.value = env
    showConfirmModal.value = true
    return
  }

  switchEnvironment(env)
}

/**
 * Confirm the environment switch after modal confirmation
 */
function confirmSwitch() {
  if (pendingEnvironment.value) {
    switchEnvironment(pendingEnvironment.value)
  }
  showConfirmModal.value = false
  pendingEnvironment.value = null
}

/**
 * Cancel the environment switch
 */
function cancelSwitch() {
  showConfirmModal.value = false
  pendingEnvironment.value = null
}

/**
 * Get the colored dot class for an environment
 */
function getDotClass(env: string) {
  return env === 'production' ? 'bg-success' : 'bg-warning'
}

/**
 * Get the display label for an environment
 */
function getLabel(env: string) {
  return env.charAt(0).toUpperCase() + env.slice(1)
}
</script>
