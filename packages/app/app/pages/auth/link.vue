<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="font-serif text-4xl text-center">Link Your Account</h2>
      <p class="text-md mb-4 text-center">
        Connecting your WordPress site to Create Studio
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="text-base-content/70 mt-4 text-sm">Linking your account...</p>
    </div>

    <!-- Success State -->
    <div v-if="success" class="text-center py-8">
      <div class="rounded-2xl bg-gradient-to-br from-success/20 to-success/5 size-20 flex items-center justify-center mx-auto mb-4">
        <CheckCircleIcon class="text-success size-12" />
      </div>
      <h3 class="mb-2 font-serif text-2xl">Account Linked!</h3>
      <p class="text-base-content/70 mb-2 text-sm">
        Redirecting you back to WordPress...
      </p>
    </div>

    <!-- Error State -->
    <div v-if="errorMessage && !loading" class="text-center py-8">
      <div class="rounded-2xl bg-gradient-to-br from-error/20 to-error/5 size-20 flex items-center justify-center mx-auto mb-4">
        <ExclamationCircleIcon class="text-error size-12" />
      </div>
      <h3 class="mb-2 font-serif text-2xl">Something went wrong</h3>
      <p class="text-base-content/70 mb-6 text-sm">{{ errorMessage }}</p>
      <NuxtLink to="/admin" class="btn btn-primary">Go to Dashboard</NuxtLink>
    </div>

    <!-- No Session State -->
    <div v-if="!sessionId && !loading" class="text-center py-8">
      <p class="text-base-content/70 mb-6 text-sm">No link session found. Please start the linking process from your WordPress admin.</p>
      <NuxtLink to="/admin" class="btn btn-primary">Go to Dashboard</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const { loggedIn } = useAuth()

const sessionId = ref<string | null>(null)
const loading = ref(true)
const success = ref(false)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  sessionId.value = route.query.session as string || null

  if (!sessionId.value) {
    loading.value = false
    return
  }

  // If not authenticated, redirect to login with redirect back here
  if (!loggedIn.value) {
    const currentPath = route.fullPath
    navigateTo(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
    return
  }

  // Authenticated — complete the link
  try {
    const response = await $fetch<{
      success: boolean
      return_url?: string
      error?: string
      message?: string
    }>('/api/v2/auth/link/complete', {
      method: 'POST',
      body: { session_id: sessionId.value }
    })

    if (response.success && response.return_url) {
      success.value = true
      // Redirect back to WordPress with session ID
      const returnUrl = new URL(response.return_url)
      returnUrl.searchParams.set('linked', sessionId.value!)
      setTimeout(() => {
        window.location.href = returnUrl.toString()
      }, 1000)
    } else {
      errorMessage.value = response.message || 'Failed to link your account. Please try again.'
    }
  } catch (error: any) {
    const data = error.data
    switch (data?.error) {
      case 'session_expired':
        errorMessage.value = 'This link has expired. Please go back to WordPress and click "Link Your Account" again.'
        break
      case 'session_not_found':
        errorMessage.value = 'This link session was not found or has already been used.'
        break
      case 'unauthorized':
        errorMessage.value = 'Please log in to link your account.'
        break
      default:
        errorMessage.value = data?.message || error.message || 'An error occurred. Please try again.'
    }
  } finally {
    loading.value = false
  }
})

useHead({
  title: 'Link Account - Create Studio',
  meta: [
    { name: 'description', content: 'Link your WordPress account with Create Studio' }
  ]
})
</script>
