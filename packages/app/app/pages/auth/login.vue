<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="font-serif text-4xl text-center">Login</h2>
      <p class="text-md mb-4 text-center">
        Manage your Create sites
      </p>
    </div>

    <div v-if="accountExistsMessage" class="alert alert-info">
      <span>An account already exists with this email. Please log in or <NuxtLink to="/auth/request-reset" class="link">reset your password</NuxtLink> if you've forgotten it.</span>
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

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Password</legend>
            <label class="input input-lg validator w-full">
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
              class="btn btn-primary btn-xl"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner"></span>
              {{ loading ? 'Logging in...' : 'Login' }}
            </button>
          </div>

          <div class="flex items-center justify-center gap-4 mt-6 text-sm">
            <NuxtLink to="/auth/register" class="link link-base-content">
              Register
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth'
import { setSelectedSiteId } from '~/composables/useSiteContext'

definePageMeta({
  layout: 'auth'
})

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

// Check for account-exists message from registration redirect
const accountExistsMessage = computed(() => route.query.message === 'account-exists')

const email = ref((route.query.email as string) || '')
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

      // Redirect to requested page or admin dashboard
      const redirectTo = route.query.redirect as string
      if (redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo)
      } else {
        router.push('/admin')
      }
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
