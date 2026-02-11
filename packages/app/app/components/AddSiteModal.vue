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

      <!-- Step 2: Instructions -->
      <div v-if="currentStep === 2">
        <div class="mb-6 text-center">
          <div class="rounded-2xl bg-gradient-to-br from-warning/10 to-warning/5 size-16 flex items-center justify-center mx-auto mb-4">
            <KeyIcon class="text-warning size-8" />
          </div>
          <h3 class="mb-2 font-serif text-2xl">Get Verification Code</h3>
        </div>

        <!-- Site Info -->
        <div class="bg-base-200/50 rounded-xl flex items-center gap-3 p-4 mb-6">
          <div class="bg-base-300 size-10 flex items-center justify-center rounded-lg">
            <GlobeAltIcon class="size-5 text-base-content/70" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ pendingSite?.url }}</p>
            <p class="text-warning text-xs">Pending verification</p>
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
            <span>Click <strong>"Generate Code"</strong></span>
          </li>
          <li class="flex gap-3">
            <span class="bg-primary text-primary-content size-5 shrink-0 flex items-center justify-center text-xs font-bold rounded-full">3</span>
            <span>Copy the 32-character code</span>
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
          <button @click="currentStep = 3" class="btn btn-primary flex-1">
            I have my code
            <ArrowRightIcon class="size-4" />
          </button>
        </div>
      </div>

      <!-- Step 3: Verify -->
      <div v-if="currentStep === 3">
        <div class="mb-6 text-center">
          <div class="rounded-2xl bg-gradient-to-br from-success/10 to-success/5 size-16 flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon class="text-success size-8" />
          </div>
          <h3 class="mb-2 font-serif text-2xl">Enter Code</h3>
          <p class="text-base-content/70 text-sm">
            Paste the 32-character code from your plugin.
          </p>
        </div>

        <form @submit.prevent="handleVerify" class="space-y-4">
          <fieldset class="fieldset">
            <label class="input input-bordered w-full font-mono">
              <input
                v-model="verificationCode"
                type="text"
                placeholder="Paste verification code"
                class="grow text-sm tracking-wider text-center"
                maxlength="32"
                required
              />
            </label>
            <p class="text-base-content/50 mt-1 text-xs text-center">
              {{ verificationCode.length }}/32 characters
            </p>
          </fieldset>

          <div v-if="verifyError" class="alert alert-error py-2 text-sm">
            <ExclamationCircleIcon class="size-4" />
            <span>{{ verifyError }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-success w-full"
            :disabled="verifying || verificationCode.length !== 32"
          >
            <span v-if="verifying" class="loading loading-spinner loading-sm"></span>
            {{ verifying ? 'Verifying...' : 'Verify & Connect' }}
            <CheckIcon v-if="!verifying" class="size-4" />
          </button>
        </form>

        <button @click="currentStep = 2" class="btn btn-ghost btn-sm w-full mt-2">
          <ArrowLeftIcon class="size-3" />
          Back
        </button>
      </div>

      <!-- Step 4: Success -->
      <div v-if="currentStep === 4">
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
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  LockClosedIcon,
  KeyIcon,
  ShieldCheckIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  isOpen: boolean
  initialUrl?: string
  initialVerificationCode?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'site-added', site: { id: number; url: string; name?: string }): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const currentStep = ref(1)
const siteUrl = ref('')
const verificationCode = ref('')
const loading = ref(false)
const verifying = ref(false)
const error = ref('')
const verifyError = ref('')
const pendingSite = ref<{ id: number; url: string; name?: string } | null>(null)
const verifiedSite = ref<{ id: number; url: string; name?: string } | null>(null)

// Build the WP settings URL with proper protocol and hash
const wpSettingsUrl = computed(() => {
  if (!pendingSite.value?.url) return '#'
  // Ensure URL has protocol
  let baseUrl = pendingSite.value.url
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`
  }
  return `${baseUrl}/wp-admin/edit.php?page=settings&post_type=mv_create#tab=mv_create_api`
})

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    // Pre-fill with initialUrl if provided
    if (props.initialUrl) {
      // Strip protocol for display
      siteUrl.value = props.initialUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    }
    // Pre-fill verification code if provided
    if (props.initialVerificationCode) {
      verificationCode.value = props.initialVerificationCode
    }
    dialogRef.value?.showModal()

    // Auto-submit if both URL and verification code are provided
    if (props.initialUrl && props.initialVerificationCode) {
      await handleAddSite()
      // handleAddSite advances to step 4 if already verified, step 2 if pending
      // Only skip to step 3 (enter code) if still pending
      if (pendingSite.value && currentStep.value === 2) {
        currentStep.value = 3
      }
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
  verificationCode.value = ''
  error.value = ''
  verifyError.value = ''
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
        // Site is already verified — re-sync token with WordPress plugin if we have a code
        if (props.initialVerificationCode && response.site.id) {
          try {
            await $fetch(`/api/v2/sites/${response.site.id}/verify`, {
              method: 'POST',
              body: { verification_code: props.initialVerificationCode },
            })
          } catch {
            // Token re-sync failed — not critical, site is still verified
          }
        }
        verifiedSite.value = response.site
        currentStep.value = 4
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

const handleVerify = async () => {
  verifyError.value = ''
  verifying.value = true

  try {
    if (!pendingSite.value?.id) {
      verifyError.value = 'No site selected'
      return
    }

    const response = await $fetch<{
      success: boolean
      error?: string
      site?: { id: number; url: string; name?: string }
      verified_at?: string
    }>(`/api/v2/sites/${pendingSite.value.id}/verify`, {
      method: 'POST',
      body: { verification_code: verificationCode.value },
    })

    if (response.success && response.site) {
      verifiedSite.value = response.site
      currentStep.value = 4
    }
    else {
      verifyError.value = response.error || 'Verification failed'
    }
  }
  catch (err: any) {
    verifyError.value = err.data?.error || err.message || 'Verification failed'
  }
  finally {
    verifying.value = false
  }
}

const handleComplete = () => {
  if (verifiedSite.value) {
    emit('site-added', verifiedSite.value)
  }
  closeModal()
}
</script>
