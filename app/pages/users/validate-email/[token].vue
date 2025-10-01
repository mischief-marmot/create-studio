<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="card w-96"
    :class="[
      !success && !error ? 'bg-primary text-primary-content' : '',
      success ? 'bg-success text-success-content' : '',
      error ? 'bg-error text-error-content' : '',
    ]"
      >
      <div class="card-body items-center text-center space-y-4">
        <h2 class="card-title">{{ pending ? 'Validating...' : success ? 'Validation Successful' : 'Validation Failed' }}</h2>
        <div v-if="pending" class="py-8">
          <span class="loading loading-spinner loading-lg text-primary-content"></span>
          <p class="mt-4 ">Validating your email...</p>
        </div>

        <div v-else-if="error">
            <p class="text-sm font-bold">{{ errorMessage || 'Oops! Something went wrong :(' }}</p>
            <p class="text-sm">Please try again later, or contact us at 
              <a class="underline" href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
        </div>

        <div v-else-if="success">
          <div>
            <p class="text-sm">Your email address has been validated. You can now use all features of Create!</p>
          </div>
        </div>

        <div v-if="!pending" class="card-actions justify-end">
          <button class="btn btn-accent"
          :class="[
            success ? 'btn-success bg-success-content text-success' : '',
            error ? 'btn-error bg-error-content text-error' : '',
          ]"
           @click="closeWindow">Close this Window</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from 'nuxt/app'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'


const config = useRuntimeConfig()
const supportEmail = config.public.supportEmail || 'support@create.studio'
const route = useRoute()
const token = route.params.token as string
const logger = useLogger('ValidateEmail:Token', config.public.debug)

const pending = ref(true)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')

logger.debug('Mounting')

const closeWindow = () => {
  window.close()
}

onMounted(async () => {
  if (!token) {
    pending.value = false
    error.value = true
    errorMessage.value = 'No validation token provided'
    logger.debug(error)
    return
  }
  logger.debug('Validating')
  try {
    const response = await $fetch('/api/v1/users/validate-email', {
      method: 'POST',
      body: { token }
    })
    // slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (response.success) {
      success.value = true
    } else {
      error.value = true
      errorMessage.value = response.error || 'Validation failed'
    }
  } catch (err: any) {
    error.value = true
    errorMessage.value = err.data?.error.message || err.message || 'An error occurred during validation'
    logger.debug(errorMessage.value, error.value)
  } finally {
    pending.value = false
  }
})

useHead({
  title: 'Email Validation - Create Studio',
  meta: [
    { name: 'description', content: 'Validate your email address for Create Studio' }
  ]
})
</script>