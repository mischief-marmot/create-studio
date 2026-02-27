<template>
  <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-lg">
      <!-- Close Button -->
      <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost right-4 top-4 absolute">
        <XMarkIcon class="size-5" />
      </button>

      <!-- Instructions Step -->
      <div v-if="!verified">
        <div class="mb-6 text-center">
          <div class="rounded-2xl bg-gradient-to-br from-warning/10 to-warning/5 size-16 flex items-center justify-center mx-auto mb-4">
            <LinkIcon class="text-warning size-8" />
          </div>
          <h3 class="mb-2 font-serif text-2xl">Connect Your Site</h3>
        </div>

        <!-- Site Info -->
        <div class="bg-base-200/50 rounded-xl flex items-center gap-3 p-4 mb-6">
          <div class="bg-base-300 size-10 flex items-center justify-center rounded-lg">
            <GlobeAltIcon class="size-5 text-base-content/70" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ site?.url }}</p>
            <p class="text-warning text-xs">Pending connection</p>
          </div>
        </div>

        <!-- Instructions -->
        <ol class="mb-6 space-y-3 text-sm">
          <li class="flex gap-3">
            <span class="bg-primary text-primary-content size-5 shrink-0 flex items-center justify-center text-xs font-bold rounded-full">1</span>
            <span>Go to WordPress → <strong>Settings → Create</strong></span>
          </li>
          <li class="flex gap-3">
            <span class="bg-primary text-primary-content size-5 shrink-0 flex items-center justify-center text-xs font-bold rounded-full">2</span>
            <span>Open the <strong>Register</strong> tab</span>
          </li>
          <li class="flex gap-3">
            <span class="bg-primary text-primary-content size-5 shrink-0 flex items-center justify-center text-xs font-bold rounded-full">3</span>
            <span>Follow the prompts to connect your site</span>
          </li>
        </ol>

        <div class="flex gap-2">
          <NuxtLink
            :href="wpSettingsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline flex-1"
          >
            Open WP Settings
            <ArrowTopRightOnSquareIcon class="size-4" />
          </NuxtLink>
          <button @click="checkConnection" class="btn btn-primary flex-1" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            {{ loading ? 'Checking...' : 'Check Connection' }}
          </button>
        </div>

        <div v-if="error" class="alert alert-error py-2 text-sm mt-4">
          <ExclamationCircleIcon class="size-4" />
          <span>{{ error }}</span>
        </div>
      </div>

      <!-- Success Step -->
      <div v-else>
        <div class="py-4 text-center">
          <div class="rounded-2xl bg-gradient-to-br from-success/20 to-success/5 size-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon class="text-success size-12" />
          </div>
          <h3 class="mb-2 font-serif text-2xl">Site Connected!</h3>
          <p class="text-base-content/70 mb-6 text-sm">
            Your site is now connected to Create Studio.
          </p>

          <button @click="handleComplete" class="btn btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

interface Site {
  id: number
  url: string
  name?: string
}

const props = defineProps<{
  isOpen: boolean
  site: Site | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'verified', site: Site): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const loading = ref(false)
const error = ref('')
const verified = ref(false)

// Build the WP settings URL pointing to the Create Studio tab
const wpSettingsUrl = computed(() => {
  if (!props.site?.url) return '#'
  let baseUrl = props.site.url
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`
  }
  return `${baseUrl}/wp-admin/edit.php?post_type=mv_create&page=settings#create-studio`
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    dialogRef.value?.showModal()
  }
  else {
    dialogRef.value?.close()
  }
})

const closeModal = () => {
  // If already confirmed connected, emit verified so the dashboard refreshes
  if (verified.value && props.site) {
    emit('verified', props.site)
  }
  resetState()
  emit('close')
}

const resetState = () => {
  error.value = ''
  verified.value = false
}

const checkConnection = async () => {
  error.value = ''
  loading.value = true

  try {
    if (!props.site?.id) {
      error.value = 'No site selected'
      return
    }

    const response = await $fetch<{
      success: boolean
      sites: Array<{ id: number; pending: boolean; name?: string; url: string }>
    }>('/api/v2/sites')

    if (response.success) {
      const site = response.sites.find(s => s.id === props.site!.id)
      if (site && !site.pending) {
        verified.value = true
      }
      else {
        error.value = 'Not connected yet. Open the Register tab in your plugin settings to connect.'
      }
    }
  }
  catch (err: any) {
    error.value = err.data?.error || err.message || 'Could not check connection status'
  }
  finally {
    loading.value = false
  }
}

const handleComplete = () => {
  if (props.site) {
    emit('verified', props.site)
  }
  closeModal()
}
</script>
