<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="text-center font-serif text-4xl">Reset Your Password</h2>
      <p class="text-md text-center mb-4">
        Enter your new password below.
      </p>
    </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">New Password</legend>
            <label class="input input-lg w-full validator">
              <LockClosedIcon class="h-8 opacity-50" />
              <input
                v-model="password"
                type="password"
                placeholder="Enter password (min 8 characters)"
                required
                minlength="8"
              />
            </label>
            <div v-if="errors.password" class="error">{{ errors.password }}</div>
            <div class="validator-hint">Must be at least 8 characters long</div>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Confirm Password</legend>
            <label class="input input-lg w-full validator">
              <ShieldCheckIcon class="h-8 opacity-50" />
              <input
                v-model="confirmPassword"
                type="password"
                placeholder="Confirm password"
                :pattern="password"
                minlength="8"
                required
              />
            </label>
            <div class="validator-hint">Must match password and be 8 characters long</div>
          </fieldset>

          <div v-if="errors.general" class="alert alert-error">
            <span>{{ errors.general }}</span>
          </div>

          <div v-if="success" class="alert alert-success">
            <span>Password reset successfully! Redirecting to login...</span>
          </div>

          <div class="form-control mt-8 text-center">
            <button
              type="submit"
              class="btn btn-accent btn-xl"
              :disabled="loading || success"
            >
              <span v-if="loading" class="loading loading-spinner"></span>
              {{ loading ? 'Resetting Password...' : 'Reset Password' }}
            </button>
          </div>

          <div class="text-center mt-6">
            <NuxtLink to="/auth/login" class="link link-base-content text-sm">
              Back to Login
            </NuxtLink>
          </div>
        </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const errors = ref<Record<string, string>>({})

const token = route.params.token as string

const handleSubmit = async () => {
  errors.value = {}

  // Validation
  if (password.value.length < 8) {
    errors.value.password = 'Password must be at least 8 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    const response = await $fetch('/api/v2/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        password: password.value
      }
    })

    if (response.success) {
      success.value = true
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } else {
      errors.value.general = response.error || 'Failed to reset password'
    }
  } catch (error: any) {
    errors.value.general = error.data?.error || error.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Reset Password - Create Studio',
  meta: [
    { name: 'description', content: 'Reset your password for Create Studio' }
  ]
})
</script>
