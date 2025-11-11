<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="font-serif text-4xl text-center">Reset Password</h2>
      <p class="text-md mb-4 text-center">
        Enter your email address and we'll send you a password reset link.
      </p>
    </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
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

          <div v-if="errors.general" class="alert alert-error">
            <span>{{ errors.general }}</span>
          </div>

          <div v-if="success" class="alert alert-success">
            <span>{{ successMessage }}</span>
          </div>

          <!-- Consent Checkboxes -->
          <div v-if="!success" class="border-base-300 pt-4 space-y-3 border-t">
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
                <a href="/terms" target="_blank" class="link link-secondary">
                  Terms of Service
                </a>
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
                <a href="/privacy" target="_blank" class="link link-secondary">
                  Privacy Policy
                </a>
                <span class="text-error">*</span>
              </span>
            </label>
          </div>

          <div class="form-control mt-8 text-center">
            <button
              type="submit"
              class="btn btn-accent btn-xl"
              :disabled="loading || success || !consentTos || !consentPrivacy"
            >
              <span v-if="loading" class="loading loading-spinner"></span>
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </div>

          <div class="mt-6 text-center">
            <NuxtLink to="/auth/login" class="link link-base-content text-sm">
              Back to Login
            </NuxtLink>
          </div>
        </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EnvelopeIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'auth'
})

const email = ref('')
const loading = ref(false)
const success = ref(false)
const successMessage = ref('')
const errors = ref<Record<string, string>>({})

// Consent flags
const consentTos = ref(false)
const consentPrivacy = ref(false)

const handleSubmit = async () => {
  errors.value = {}

  // Validate required consents
  if (!consentTos.value || !consentPrivacy.value) {
    errors.value.general = 'You must agree to the Terms of Service and Privacy Policy'
    return
  }

  loading.value = true

  try {
    const response = await $fetch('/api/v2/auth/request-password-reset', {
      method: 'POST',
      body: {
        email: email.value
      }
    })

    if (response.success) {
      success.value = true
      successMessage.value = response.message || 'If an account exists with that email, a password reset link has been sent.'
    } else {
      errors.value.general = response.error || 'Failed to send reset email'
    }
  } catch (error: any) {
    errors.value.general = error.data?.error || error.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Request Password Reset - Create Studio',
  meta: [
    { name: 'description', content: 'Request a password reset for Create Studio' }
  ]
})
</script>
