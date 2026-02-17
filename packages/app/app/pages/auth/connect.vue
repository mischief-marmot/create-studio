<template>
  <div class="flex flex-col space-y-4">
    <div>
      <h2 class="font-serif text-4xl text-center">Connect Your Site</h2>
      <p class="text-md mb-4 text-center">
        Connecting your WordPress site to Create Studio
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="state === 'loading'" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Confirm State -->
    <div v-if="state === 'confirm'" class="py-4">
      <div class="card bg-base-200 mb-6">
        <div class="card-body items-center text-center">
          <div class="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 size-16 flex items-center justify-center mb-2">
            <LinkIcon class="text-primary size-8" />
          </div>
          <h3 class="card-title text-lg">{{ displayUrl }}</h3>
          <p class="text-base-content/70 text-sm">This site will be connected to your Create Studio account.</p>
        </div>
      </div>
      <button class="btn btn-primary w-full" @click="handleConnect">Connect Site</button>
      <NuxtLink to="/admin" class="btn btn-ghost w-full mt-2">Cancel</NuxtLink>
    </div>

    <!-- Connecting State -->
    <div v-if="state === 'connecting'" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="text-base-content/70 mt-4 text-sm">Connecting your site...</p>
    </div>

    <!-- Success State -->
    <div v-if="state === 'success'" class="text-center py-8">
      <div class="rounded-2xl bg-gradient-to-br from-success/20 to-success/5 size-20 flex items-center justify-center mx-auto mb-4">
        <CheckCircleIcon class="text-success size-12" />
      </div>
      <h3 class="mb-2 font-serif text-2xl">Site Connected!</h3>
      <p class="text-base-content/70 mb-2 text-sm">
        Redirecting you back to WordPress...
      </p>
    </div>

    <!-- Error State -->
    <div v-if="state === 'error'" class="text-center py-8">
      <div class="rounded-2xl bg-gradient-to-br from-error/20 to-error/5 size-20 flex items-center justify-center mx-auto mb-4">
        <ExclamationCircleIcon class="text-error size-12" />
      </div>
      <h3 class="mb-2 font-serif text-2xl">Something went wrong</h3>
      <p class="text-base-content/70 mb-6 text-sm">{{ errorMessage }}</p>
      <NuxtLink to="/admin" class="btn btn-primary">Go to Dashboard</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircleIcon, ExclamationCircleIcon, LinkIcon } from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const { loggedIn } = useAuth()

const state = ref<'loading' | 'confirm' | 'connecting' | 'success' | 'error'>('loading')
const siteUrl = ref<string | null>(null)
const connectToken = ref<string | null>(null)
const returnUrl = ref<string | null>(null)
const errorMessage = ref<string>('')
const displayUrl = ref<string>('')

onMounted(async () => {
  siteUrl.value = route.query.site_url as string || null
  connectToken.value = route.query.token as string || null
  returnUrl.value = route.query.return_url as string || null

  if (!siteUrl.value || !connectToken.value || !returnUrl.value) {
    state.value = 'error'
    errorMessage.value = 'Missing required connection parameters. Please start the connection process from your WordPress admin.'
    return
  }

  // If not authenticated, redirect to login with redirect back here
  if (!loggedIn.value) {
    const currentPath = route.fullPath
    navigateTo(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
    return
  }

  // Authenticated — show confirmation
  displayUrl.value = siteUrl.value.replace(/^https?:\/\//, '')
  state.value = 'confirm'
})

async function handleConnect() {
  state.value = 'connecting'

  try {
    const response = await $fetch<{
      success: boolean
      error?: string
      message?: string
    }>('/api/v2/sites/connect', {
      method: 'POST',
      body: {
        site_url: siteUrl.value,
        connect_token: connectToken.value,
        return_url: returnUrl.value,
      }
    })

    if (response.success) {
      state.value = 'success'
      const url = new URL(returnUrl.value!)
      url.searchParams.set('connected', 'true')
      setTimeout(() => {
        window.location.href = url.toString()
      }, 1000)
    } else {
      state.value = 'error'
      errorMessage.value = response.message || 'Failed to connect your site. Please try again.'
    }
  } catch (error: any) {
    state.value = 'error'
    const data = error.data
    errorMessage.value = data?.message || error.message || 'An error occurred. Please try again.'
  }
}

useHead({
  title: 'Connect Site - Create Studio',
  meta: [
    { name: 'description', content: 'Connect your WordPress site to Create Studio' }
  ]
})
</script>
