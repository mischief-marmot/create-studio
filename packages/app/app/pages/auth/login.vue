<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="text-center font-serif text-4xl">Login</h2>
      <p class="text-md text-center mb-4">
        Manage your Create sites
      </p>
    </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Email</legend>
            <label class="input input-lg w-full validator">
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

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Password</legend>
            <label class="input input-lg w-full validator">
              <LockClosedIcon class="h-8 opacity-50" />
              <input
                v-model="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </label>
            <div class="validator-hint">Password is required</div>
            <div v-if="errors.password" class="error">{{ errors.password }}</div>
          </fieldset>

          <div v-if="errors.general" class="alert alert-error">
            <span>{{ errors.general }}</span>
          </div>

          <div class="form-control mt-8 text-center">
            <button
              type="submit"
              class="btn btn-accent btn-xl"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner"></span>
              {{ loading ? 'Logging in...' : 'Login' }}
            </button>
          </div>

          <div class="divider text-sm pt-8 pb-3">Forgot password?</div>

          <div class="text-center">
            <NuxtLink to="/auth/request-reset" class="link link-base-content text-sm">
              Reset your password
            </NuxtLink>
          </div>
        </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth'
import { setSelectedSiteId } from '~/composables/useSiteContext'

definePageMeta({
  layout: 'auth'
})

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

const handleSubmit = async () => {
  errors.value = {}
  loading.value = true

  try {
    const response = await $fetch('/api/v2/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    if (response.success) {
      // Session is set server-side, refresh client session
      await login()

      // Set initial site context if user has sites
      if (response.sites && response.sites.length > 0) {
        setSelectedSiteId(response.sites[0].id)
      }

      // Redirect to admin dashboard
      router.push('/admin')
    } else {
      errors.value.general = response.error || 'Login failed'
    }
  } catch (error: any) {
    errors.value.general = error.data?.error || error.message || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Login - Create Studio',
  meta: [
    { name: 'description', content: 'Login to Create Studio' }
  ]
})
</script>
