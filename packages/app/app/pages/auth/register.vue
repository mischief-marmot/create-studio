<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="font-serif text-4xl text-center">Register for Create</h2>
      <p class="text-md mb-4 text-center">
        Sign up to use all of Create's features—for free!
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

const handleSubmit = async () => {
  errors.value = {}

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
        marketing_opt_in: true,
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
