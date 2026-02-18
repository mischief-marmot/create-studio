<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="font-serif text-4xl text-center">Register for Create</h2>
      <p class="text-md mb-4 text-center">
        Sign up to use all of Create's features—for free!
      </p>
    </div>

    <!-- Password Reset Sent Notice -->
    <div v-if="passwordResetSent" class="alert alert-info">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="shrink-0 w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <div>
          <h3 class="font-bold">Check your email</h3>
          <p class="text-sm">{{ passwordResetMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Pending Site Verification Notice -->
    <div v-if="pendingVerification && siteUrl" class="alert alert-warning">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="shrink-0 w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <div>
          <h3 class="font-bold">Complete Site Connection</h3>
          <p class="text-sm">After registering, go to your WordPress plugin settings to copy the site verification code.</p>
        </div>
      </div>
    </div>

    <form v-if="!passwordResetSent" @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Email -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Email</legend>
        <label class="input input-lg validator w-full">
          <EnvelopeIcon class="h-8 opacity-50" />
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </label>
        <div class="validator-hint">Enter a valid email address</div>
        <div v-if="errors.email" class="error">{{ errors.email }}</div>
      </fieldset>

      <!-- First and Last Name (Side by Side) -->
      <div class="grid grid-cols-2 gap-4">
        <!-- First Name -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">First Name</legend>
          <label class="input input-lg validator w-full">
            <UserIcon class="h-8 opacity-50" />
            <input
              v-model="firstName"
              type="text"
              placeholder="John"
              required
            />
          </label>
          <div v-if="errors.firstName" class="error">{{ errors.firstName }}</div>
        </fieldset>

        <!-- Last Name -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Last Name</legend>
          <label class="input input-lg validator w-full">
            <UserIcon class="h-8 opacity-50" />
            <input
              v-model="lastName"
              type="text"
              placeholder="Doe"
            />
          </label>
          <div v-if="errors.lastName" class="error">{{ errors.lastName }}</div>
        </fieldset>
      </div>

      <!-- Password -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Password</legend>
        <label class="input input-lg validator w-full">
          <LockClosedIcon class="h-8 opacity-50" />
          <input
            v-model="password"
            type="password"
            placeholder="Enter a secure password"
            required
          />
        </label>
        <div class="validator-hint">Password should be at least 8 characters</div>
        <div v-if="errors.password" class="error">{{ errors.password }}</div>
      </fieldset>

      <!-- Confirm Password -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Confirm Password</legend>
        <label class="input input-lg validator w-full" :class="{ 'input-error': passwordMismatch }">
          <LockClosedIcon class="h-8 opacity-50" />
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            required
          />
        </label>
        <div v-if="passwordMismatch" class="error">Passwords do not match</div>
        <div v-else-if="errors.confirmPassword" class="error">{{ errors.confirmPassword }}</div>
      </fieldset>

      <!-- General Error -->
      <div v-if="errors.general" class="alert alert-error">
        <span>{{ errors.general }}</span>
      </div>

      <!-- Agreement Notice -->
      <div class="border-base-300 pt-4 border-t">
        <p class="text-base-content text-sm leading-relaxed">
          By registering, you agree to our
          <NuxtLink to="/legal/terms" target="_blank" class="link link-info">Terms of Service</NuxtLink>,
          <NuxtLink to="/legal/privacy" target="_blank" class="link link-info">Privacy Policy</NuxtLink>, and
          <NuxtLink to="/legal/cookies" target="_blank" class="link link-info">Cookies Policy</NuxtLink>.
        </p>
      </div>

      <!-- Submit Button -->
      <div class="form-control mt-8 text-center">
        <button
          type="submit"
          class="btn btn-primary btn-xl"
          :disabled="loading"
        >
          <span v-if="loading" class="loading loading-spinner"></span>
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </div>

      <div class="flex items-center justify-center gap-4 mt-6 text-sm">
        <NuxtLink to="/auth/login" class="link link-base-content">
          Login
        </NuxtLink>
        <span class="text-base-content/20">•</span>
        <NuxtLink to="/auth/request-reset" class="link link-base-content">
          Forgot password?
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth',
})

const router = useRouter()
const route = useRoute()
const { login } = useAuth()
const { storeRedirect, consumeRedirect } = useAuthRedirect()

// Persist ?redirect= so it survives navigating to login/reset
storeRedirect()

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

// Computed property for real-time password match validation
const passwordMismatch = computed(() => {
  // Only show mismatch if confirmPassword has been typed
  return confirmPassword.value.length > 0 && password.value !== confirmPassword.value
})

// New state for handling email conflicts and plugin registration
const passwordResetSent = ref(false)
const passwordResetMessage = ref('')
const pendingVerification = ref(false)
const siteUrl = ref('')
const source = ref('')

// Pre-fill from URL query params (from plugin registration)
onMounted(() => {
  if (route.query.email) {
    email.value = route.query.email as string
  }
  if (route.query.site_url) {
    siteUrl.value = route.query.site_url as string
    pendingVerification.value = true
  }
  if (route.query.source) {
    source.value = route.query.source as string
  }
})

const handleSubmit = async () => {
  errors.value = {}

  // Validate password mtch
  if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match'
    return
  }

  // Validate password strength
  if (password.value.length < 8) {
    errors.value.password = 'Password must be at least 8 characters'
    return
  }

  loading.value = true

  try {
    // Build query string if coming from plugin
    const queryParams = source.value === 'plugin' ? '?source=plugin' : ''

    const response = await $fetch<{
      success: boolean
      error?: string
      passwordResetSent?: boolean
      message?: string
      shouldLogin?: boolean
      pendingVerification?: boolean
      site?: { id: number; url: string }
      user?: { id: number; email: string }
    }>(`/api/v2/auth/register${queryParams}`, {
      method: 'POST',
      body: {
        email: email.value,
        firstname: firstName.value,
        lastname: lastName.value,
        password: password.value,
        marketing_opt_in: true,
        site_url: siteUrl.value || undefined,
      },
    })

    if (response.success) {
      // Session is set server-side, refresh client session
      await login()

      // If registered from plugin with pending site verification
      if (response.pendingVerification && response.site) {
        // Redirect to admin dashboard with site_url to trigger verification modal
        router.push(`/admin?site_url=${encodeURIComponent(response.site.url)}`)
      }
      else {
        // Redirect to stored path or admin dashboard
        const redirectTo = consumeRedirect()
        router.push(redirectTo || '/admin')
      }
    }
    else if (response.passwordResetSent) {
      // V1 user without password - show password reset notice
      passwordResetSent.value = true
      passwordResetMessage.value = response.message || 'A password setup link has been sent to your email.'
    }
    else if (response.shouldLogin) {
      // User exists with password - redirect to login
      router.push(`/auth/login?email=${encodeURIComponent(email.value)}&message=account-exists`)
    }
    else {
      errors.value.general = response.error || 'Registration failed'
    }
  }
  catch (error: any) {
    // Handle HTTP error responses
    const data = error.data

    if (data?.passwordResetSent) {
      passwordResetSent.value = true
      passwordResetMessage.value = data.message || 'A password setup link has been sent to your email.'
    }
    else if (data?.shouldLogin) {
      router.push(`/auth/login?email=${encodeURIComponent(email.value)}&message=account-exists`)
    }
    else {
      errors.value.general = data?.error || error.message || 'Failed to create account'
    }
  }
  finally {
    loading.value = false
  }
}

useHead({
  title: 'Create Account - Create Studio',
  meta: [
    { name: 'description', content: 'Sign up for Create Studio' },
  ],
})
</script>
