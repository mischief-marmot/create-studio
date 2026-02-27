<template>
  <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-lg">
      <!-- Close Button -->
      <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost right-4 top-4 absolute">
        <XMarkIcon class="size-5" />
      </button>

      <!-- Step 1: Enter URL -->
      <div v-if="currentStep === 1">
        <div class="mb-8 text-center">
          <div class="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 size-16 flex items-center justify-center mx-auto mb-4">
            <GlobeAltIcon class="text-primary size-8" />
          </div>
          <h3 class="mb-2 font-serif text-2xl">Connect a Site</h3>
          <p class="text-base-content/70 text-sm">
            Enter your WordPress site URL to get started.
          </p>
        </div>

        <form @submit.prevent="handleAddSite" class="space-y-4">
          <fieldset class="fieldset">
            <label class="input input-bordered flex items-center w-full gap-2">
              <LockClosedIcon class="size-4 text-success" />
              <span class="text-base-content/50 text-sm">https://</span>
              <input
                v-model="siteUrl"
                type="text"
                placeholder="example.com"
                class="grow"
                required
              />
            </label>
          </fieldset>

          <div v-if="error" class="alert alert-error py-2 text-sm">
            <ExclamationCircleIcon class="size-4" />
            <span>{{ error }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full"
            :disabled="loading || !siteUrl"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            {{ loading ? 'Connecting...' : 'Continue' }}
            <ArrowRightIcon v-if="!loading" class="size-4" />
          </button>
        </form>

        <p class="text-base-content/50 mt-4 text-xs text-center">
          Make sure the Create plugin is installed on your site.
        </p>
      </div>

      <!-- Step 2: Connect via plugin -->
      <div v-if="currentStep === 2">
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
            <p class="text-sm font-medium truncate">{{ pendingSite?.url }}</p>
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
          <a
            :href="wpSettingsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline flex-1"
          >
            Open WP Settings
            <ArrowTopRightOnSquareIcon class="size-4" />
          </a>
          <button @click="checkConnection" class="btn btn-primary flex-1" :disabled="checkingConnection">
            <span v-if="checkingConnection" class="loading loading-spinner loading-sm"></span>
            {{ checkingConnection ? 'Checking...' : 'Check Connection' }}
          </button>
        </div>

        <div v-if="connectionError" class="alert alert-error py-2 text-sm mt-4">
          <ExclamationCircleIcon class="size-4" />
          <span>{{ connectionError }}</span>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div v-if="currentStep === 3">
        <div class="py-4 text-center">
          <div class="rounded-2xl bg-gradient-to-br from-success/20 to-success/5 size-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon class="text-success size-12" />
          </div>
          <h3 class="mb-2 font-serif text-2xl">Site Connected!</h3>
          <p class="text-base-content/70 mb-6 text-sm">
            Your WordPress site is now connected.
          </p>

          <!-- Connected Site Card -->
          <div class="bg-success/10 border-success/20 rounded-xl flex items-center gap-3 p-4 mb-6 border">
            <div class="bg-success/20 size-10 flex items-center justify-center rounded-lg">
              <GlobeAltIcon class="size-5 text-success" />
            </div>
            <div class="flex-1 min-w-0 text-left">
              <p class="text-sm font-medium truncate">{{ verifiedSite?.name || verifiedSite?.url }}</p>
              <p class="text-success text-xs">Verified</p>
            </div>
          </div>

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
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  LockClosedIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  isOpen: boolean
  initialUrl?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'site-added', site: { id: number; url: string; name?: string }): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const currentStep = ref(1)
const siteUrl = ref('')
const loading = ref(false)
const error = ref('')
const checkingConnection = ref(false)
const connectionError = ref('')
const pendingSite = ref<{ id: number; url: string; name?: string } | null>(null)
const verifiedSite = ref<{ id: number; url: string; name?: string } | null>(null)

// Build the WP settings URL pointing to the Create Studio tab
const wpSettingsUrl = computed(() => {
  if (!pendingSite.value?.url) return '#'
  let baseUrl = pendingSite.value.url
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`
  }
  return `${baseUrl}/wp-admin/edit.php?post_type=mv_create&page=settings#create-studio`
})

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    if (props.initialUrl) {
      siteUrl.value = props.initialUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    }
    dialogRef.value?.showModal()

    if (props.initialUrl) {
      await handleAddSite()
    }
  }
  else {
    dialogRef.value?.close()
  }
})

const closeModal = () => {
  resetState()
  emit('close')
}

const resetState = () => {
  currentStep.value = 1
  siteUrl.value = ''
  error.value = ''
  connectionError.value = ''
  pendingSite.value = null
  verifiedSite.value = null
}

const handleAddSite = async () => {
  error.value = ''
  loading.value = true

  try {
    let normalizedUrl = siteUrl.value.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    const response = await $fetch<{
      success: boolean
      error?: string
      site?: { id: number; url: string; name?: string }
      pending?: boolean
      already_verified?: boolean
      verified_at?: string
    }>('/api/v2/sites/add', {
      method: 'POST',
      body: { url: normalizedUrl },
    })

    if (response.success && response.site) {
      if (response.already_verified) {
        verifiedSite.value = response.site
        currentStep.value = 3
      }
      else {
        pendingSite.value = response.site
        currentStep.value = 2
      }
    }
    else {
      error.value = response.error || 'Failed to add site'
    }
  }
  catch (err: any) {
    error.value = err.data?.error || err.message || 'Failed to add site'
  }
  finally {
    loading.value = false
  }
}

const checkConnection = async () => {
  connectionError.value = ''
  checkingConnection.value = true

  try {
    const response = await $fetch<{
      success: boolean
      sites: Array<{ id: number; pending: boolean; name?: string; url: string }>
    }>('/api/v2/sites')

    if (response.success) {
      const site = response.sites.find(s => s.id === pendingSite.value?.id)
      if (site && !site.pending) {
        verifiedSite.value = { id: site.id, url: site.url, name: site.name }
        currentStep.value = 3
      }
      else {
        connectionError.value = 'Not connected yet. Open the Create Studio tab in your plugin settings to connect.'
      }
    }
  }
  catch (err: any) {
    connectionError.value = err.data?.error || err.message || 'Could not check connection status'
  }
  finally {
    checkingConnection.value = false
  }
}

const handleComplete = () => {
  if (verifiedSite.value) {
    emit('site-added', verifiedSite.value)
  }
  closeModal()
}
</script>
