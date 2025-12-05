<template>
  <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-lg">
      <!-- Close Button -->
      <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost right-4 top-4 absolute">
        <XMarkIcon class="size-5" />
      </button>

      <!-- Instructions Step -->
      <div v-if="!showCodeInput">
        <div class="mb-6 text-center">
          <div class="rounded-2xl bg-gradient-to-br from-warning/10 to-warning/5 size-16 flex items-center justify-center mx-auto mb-4">
            <KeyIcon class="text-warning size-8" />
          </div>
          <h3 class="mb-2 font-serif text-2xl">Verify Your Site</h3>
        </div>

        <!-- Site Info -->
        <div class="bg-base-200/50 rounded-xl flex items-center gap-3 p-4 mb-6">
          <div class="bg-base-300 size-10 flex items-center justify-center rounded-lg">
            <GlobeAltIcon class="size-5 text-base-content/70" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ site?.url }}</p>
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
          <NuxtLink
            :href="wpSettingsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline flex-1"
          >
            Open WP Settings
            <ArrowTopRightOnSquareIcon class="size-4" />
          </NuxtLink>
          <button @click="showCodeInput = true" class="btn btn-primary flex-1">
            I have my code
            <ArrowRightIcon class="size-4" />
          </button>
        </div>
      </div>

      <!-- Code Input Step -->
      <div v-else-if="!verified">
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

          <div v-if="error" class="alert alert-error py-2 text-sm">
            <ExclamationCircleIcon class="size-4" />
            <span>{{ error }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-success w-full"
            :disabled="loading || verificationCode.length !== 32"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            {{ loading ? 'Verifying...' : 'Verify & Connect' }}
            <CheckIcon v-if="!loading" class="size-4" />
          </button>
        </form>

        <button @click="showCodeInput = false" class="btn btn-ghost btn-sm w-full mt-2">
          <ArrowLeftIcon class="size-3" />
          Back
        </button>
      </div>

      <!-- Success Step -->
      <div v-else>
        <div class="py-4 text-center">
          <div class="rounded-2xl bg-gradient-to-br from-success/20 to-success/5 size-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon class="text-success size-12" />
          </div>
          <h3 class="mb-2 font-serif text-2xl">Site Verified!</h3>
          <p class="text-base-content/70 mb-6 text-sm">
            Your WordPress site is now connected.
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
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  KeyIcon,
  ShieldCheckIcon,
  CheckIcon,
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
const showCodeInput = ref(false)
const verificationCode = ref('')
const loading = ref(false)
const error = ref('')
const verified = ref(false)

// Build the WP settings URL with proper protocol and hash
const wpSettingsUrl = computed(() => {
  if (!props.site?.url) return '#'
  // Ensure URL has protocol
  let baseUrl = props.site.url
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`
  }
  // Construct the full URL - hash fragment is not encoded when set this way
  return `${baseUrl}/wp-admin/edit.php?page=settings&post_type=mv_create#tab=mv_create_api`
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
  resetState()
  emit('close')
}

const resetState = () => {
  showCodeInput.value = false
  verificationCode.value = ''
  error.value = ''
  verified.value = false
}

const handleVerify = async () => {
  error.value = ''
  loading.value = true

  try {
    if (!props.site?.id) {
      error.value = 'No site selected'
      return
    }

    const response = await $fetch<{
      success: boolean
      error?: string
      site?: Site
      verified_at?: string
    }>(`/api/v2/sites/${props.site.id}/verify`, {
      method: 'POST',
      body: { verification_code: verificationCode.value },
    })

    if (response.success) {
      verified.value = true
    }
    else {
      error.value = response.error || 'Verification failed'
    }
  }
  catch (err: any) {
    error.value = err.data?.error || err.message || 'Verification failed'
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
