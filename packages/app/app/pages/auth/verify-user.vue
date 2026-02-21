<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="font-serif text-4xl text-center">Verify Your Account</h2>
      <p class="text-md mb-4 text-center">
        Enter the verification code from your WordPress plugin
      </p>
    </div>

    <!-- Not Logged In State -->
    <div v-if="!isAuthenticated && !success" class="alert alert-info">
      <InformationCircleIcon class="w-5 h-5" />
      <div>
        <span>You need to log in or create an account to complete verification.</span>
        <div class="flex gap-2 mt-2">
          <NuxtLink :to="loginUrl" class="btn btn-sm btn-primary">Log In</NuxtLink>
          <NuxtLink :to="registerUrl" class="btn btn-sm btn-outline">Register</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Verification Form (only when logged in) -->
    <form v-if="isAuthenticated && !success" @submit.prevent="handleSubmit" class="space-y-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Verification Code</legend>
        <label class="input input-lg w-full font-mono">
          <KeyIcon class="h-8 opacity-50" />
          <input
            v-model="verificationCode"
            type="text"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            class="grow tracking-wider text-center uppercase"
            maxlength="19"
            required
            @input="formatCode"
          />
        </label>
        <p class="text-base-content/50 mt-1 text-xs text-center">
          {{ codeLength }}/16 characters
        </p>
        <div v-if="errors.code" class="error">{{ errors.code }}</div>
      </fieldset>

      <div class="bg-base-200/50 rounded-xl p-4">
        <h4 class="mb-2 text-sm font-medium">Where do I find this code?</h4>
        <ol class="text-base-content/70 space-y-1 text-sm list-decimal list-inside">
          <li>Go to your WordPress admin panel</li>
          <li>Navigate to <strong>Settings &rarr; Create</strong></li>
          <li>Click <strong>"Connect Your Account"</strong> in the Registration section</li>
          <li>Copy the verification code displayed</li>
        </ol>
      </div>

      <div v-if="errors.general" class="alert alert-error">
        <ExclamationCircleIcon class="w-5 h-5" />
        <span>{{ errors.general }}</span>
      </div>

      <div class="form-control mt-8 text-center">
        <button
          type="submit"
          class="btn btn-primary btn-xl"
          :disabled="loading || !isCodeComplete"
        >
          <span v-if="loading" class="loading loading-spinner"></span>
          {{ loading ? 'Verifying...' : 'Verify Account' }}
        </button>
      </div>

      <div class="flex items-center justify-center gap-4 mt-6 text-sm">
        <NuxtLink to="/admin" class="link link-base-content">
          Go to Dashboard
        </NuxtLink>
      </div>
    </form>

    <!-- Success State -->
    <div v-if="success" class="py-8 text-center">
      <div class="rounded-2xl bg-gradient-to-br from-success/20 to-success/5 size-20 flex items-center justify-center mx-auto mb-4">
        <CheckCircleIcon class="text-success size-12" />
      </div>
      <h3 class="mb-2 font-serif text-2xl">Account Verified!</h3>
      <p class="text-base-content/70 mb-2 text-sm">
        Your WordPress site is now connected to your Create.Studio account.
      </p>
      <p v-if="verifiedSite" class="text-base-content mb-6 font-medium">
        {{ verifiedSite.site_name }}
      </p>

      <button @click="goToDashboard" class="btn btn-primary btn-xl">
        Go to Dashboard
        <ArrowRightIcon class="size-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

const router = useRouter()
const route = useRoute()
const { loggedIn } = useAuth()

const verificationCode = ref('')
const loading = ref(false)
const success = ref(false)
const errors = ref<Record<string, string>>({})
const verifiedSite = ref<{ site_id: number; site_name: string; site_url: string; redirect_url: string } | null>(null)

// Check if user is authenticated
const isAuthenticated = computed(() => loggedIn.value)

// Build login/register URLs that redirect back here after auth
const currentPath = computed(() => route.fullPath)
const loginUrl = computed(() => `/auth/login?redirect=${encodeURIComponent(currentPath.value)}`)
const registerUrl = computed(() => `/auth/register?redirect=${encodeURIComponent(currentPath.value)}`)

// Count actual alphanumeric characters (excluding dashes)
const codeLength = computed(() => {
  return verificationCode.value.replace(/[-\s]/g, '').length
})

// Check if code is complete (16 characters)
const isCodeComplete = computed(() => {
  return codeLength.value === 16
})

const STORAGE_KEY = 'create_verify_code'

// Pre-fill code from URL or sessionStorage, auto-verify if ready
onMounted(async () => {
  const codeFromUrl = route.query.code as string

  if (codeFromUrl) {
    // Save to sessionStorage as backup for auth redirect
    try { sessionStorage.setItem(STORAGE_KEY, codeFromUrl) } catch {}
    verificationCode.value = codeFromUrl
    formatCode()
  } else {
    // Restore from sessionStorage (after login/register redirect)
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        verificationCode.value = stored
        formatCode()
      }
    } catch {}
  }

  // Auto-submit if authenticated and code is complete (returning from auth redirect)
  if (isAuthenticated.value && isCodeComplete.value && !success.value) {
    await handleSubmit()
  }
})

// Format the code with dashes as user types
const formatCode = () => {
  // Remove all non-alphanumeric characters
  let code = verificationCode.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

  // Limit to 16 characters
  code = code.slice(0, 16)

  // Add dashes every 4 characters
  const parts = code.match(/.{1,4}/g) || []
  verificationCode.value = parts.join('-')
}

const handleSubmit = async () => {
  errors.value = {}
  loading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      error?: string
      message?: string
      site_id?: number
      site_name?: string
      site_url?: string
      redirect_url?: string
    }>('/api/v2/users/verify', {
      method: 'POST',
      body: {
        verification_code: verificationCode.value
      }
    })

    if (response.success) {
      success.value = true
      try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
      verifiedSite.value = {
        site_id: response.site_id!,
        site_name: response.site_name!,
        site_url: response.site_url!,
        redirect_url: response.redirect_url!
      }
    } else {
      // Map error codes to user-friendly messages
      switch (response.error) {
        case 'invalid_code':
          errors.value.general = 'Verification code not found. Please check the code and try again.'
          break
        case 'already_verified':
          errors.value.general = 'This verification code has already been used.'
          break
        case 'wrong_user':
          errors.value.general = response.message || 'This verification code is for a different account.'
          break
        case 'invalid_format':
          errors.value.code = 'Invalid code format. The code should be 16 characters.'
          break
        default:
          errors.value.general = response.message || 'Verification failed. Please try again.'
      }
    }
  } catch (error: any) {
    const data = error.data

    // Handle HTTP error responses
    switch (data?.error) {
      case 'invalid_code':
        errors.value.general = 'Verification code not found. Please check the code and try again.'
        break
      case 'already_verified':
        errors.value.general = 'This verification code has already been used.'
        break
      case 'wrong_user':
        errors.value.general = data.message || 'This verification code is for a different account.'
        break
      case 'unauthorized':
        errors.value.general = 'Please log in to verify your account.'
        break
      default:
        errors.value.general = data?.message || error.message || 'An error occurred. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const goToDashboard = () => {
  if (verifiedSite.value?.redirect_url) {
    router.push(verifiedSite.value.redirect_url)
  } else {
    router.push('/admin')
  }
}

useHead({
  title: 'Verify Account - Create Studio',
  meta: [
    { name: 'description', content: 'Verify your WordPress user account with Create Studio' }
  ]
})
</script>
