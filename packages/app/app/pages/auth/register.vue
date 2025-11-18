<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="font-serif text-4xl text-center">Create Account</h2>
      <p class="text-md mb-4 text-center">
        Sign up to start creating schema cards
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
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

      <!-- First Name -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">First Name</legend>
        <label class="input input-lg validator w-full">
          <UserIcon class="h-8 opacity-50" />
          <input
            v-model="firstName"
            type="text"
            placeholder="John"
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
        <label class="input input-lg validator w-full">
          <LockClosedIcon class="h-8 opacity-50" />
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            required
          />
        </label>
        <div v-if="errors.confirmPassword" class="error">{{ errors.confirmPassword }}</div>
      </fieldset>

      <!-- General Error -->
      <div v-if="errors.general" class="alert alert-error">
        <span>{{ errors.general }}</span>
      </div>

      <!-- Consent Checkboxes -->
      <div class="border-base-300 pt-4 space-y-3 border-t">
        <h3 class="text-base-content text-sm font-semibold">Required Agreements</h3>

        <!-- TOS Checkbox -->
        <label class="label justify-start gap-3 p-0 cursor-pointer">
          <input
            v-model="consentTos"
            type="checkbox"
            class="checkbox checkbox-sm"
            required
          />
          <span class="label-text text-sm">
            I agree to the
            <NuxtLink to="/terms" target="_blank" class="link link-secondary">
              Terms of Service
            </NuxtLink>
            <span class="text-error">*</span>
          </span>
        </label>

        <!-- Privacy Checkbox -->
        <label class="label justify-start gap-3 p-0 cursor-pointer">
          <input
            v-model="consentPrivacy"
            type="checkbox"
            class="checkbox checkbox-sm"
            required
          />
          <span class="label-text text-sm">
            I agree to the
            <NuxtLink to="/privacy" target="_blank" class="link link-secondary">
              Privacy Policy
            </NuxtLink>
            <span class="text-error">*</span>
          </span>
        </label>

        <!-- Cookies Checkbox -->
        <label class="label justify-start gap-3 p-0 cursor-pointer">
          <input
            v-model="consentCookies"
            type="checkbox"
            class="checkbox checkbox-sm"
            required
          />
          <span class="label-text text-sm">
            I agree to the
            <NuxtLink to="/cookies" target="_blank" class="link link-secondary">
              Cookie Policy
            </NuxtLink>
            <span class="text-error">*</span>
          </span>
        </label>

        <!-- Marketing Checkbox (Optional) -->
        <label class="label justify-start gap-3 p-0 cursor-pointer">
          <input
            v-model="consentMarketing"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          <span class="label-text text-sm">
            I want to receive marketing emails about new features and updates
          </span>
        </label>
      </div>

      <!-- Submit Button -->
      <div class="form-control mt-8 text-center">
        <button
          type="submit"
          class="btn btn-accent btn-xl"
          :disabled="loading || !consentTos || !consentPrivacy || !consentCookies"
        >
          <span v-if="loading" class="loading loading-spinner"></span>
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </div>

      <!-- Login Link -->
      <div class="divider pt-8 pb-3 text-sm">Already have an account?</div>

      <div class="text-center">
        <NuxtLink to="/auth/login" class="link link-base-content text-sm">
          Sign in here
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth',
})

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

// Consent flags
const consentTos = ref(false)
const consentPrivacy = ref(false)
const consentCookies = ref(false)
const consentMarketing = ref(false)

const handleSubmit = async () => {
  errors.value = {}

  // Validate required consents
  if (!consentTos.value || !consentPrivacy.value || !consentCookies.value) {
    errors.value.general = 'You must agree to all required terms to create an account'
    return
  }

  // Validate password match
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
    const response = await $fetch('/api/v2/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        firstname: firstName.value,
        lastname: lastName.value,
        password: password.value,
        marketing_opt_in: consentMarketing.value,
      },
    })

    if (response.success) {
      // Session is set server-side, refresh client session
      await login()

      // Redirect to admin dashboard
      router.push('/admin')
    } else {
      errors.value.general = response.error || 'Registration failed'
    }
  } catch (error: any) {
    errors.value.general =
      error.data?.error || error.message || 'Failed to create account'
  } finally {
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
