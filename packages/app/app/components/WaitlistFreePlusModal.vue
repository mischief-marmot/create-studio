<template>
  <dialog :class="{ 'modal-open': modelValue }" class="modal py-6">
    <div class="modal-box bg-base-100 border-base-300 max-w-md p-0 overflow-hidden border shadow-2xl">
      <!-- Header -->
      <div class="bg-gradient-to-br from-base-100 via-base-200 to-base-100 border-base-300 relative p-6 border-b">
        <div class="relative z-10">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 class="text-base-content mb-2 font-serif text-2xl font-light">
                Get Notified
              </h2>
              <p class="text-base-content/70 text-sm">
                Be the first to know when Create 2.0 Free+ launches.
              </p>
            </div>
            <button
              @click="close"
              class="hover:bg-base-300/50 flex-shrink-0 p-2 transition-colors duration-200 rounded-lg"
              aria-label="Close"
            >
              <svg class="text-base-content/60 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Form State -->
      <form v-if="!submitted" @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label for="waitlist-email" class="text-base-content mb-1 block text-sm font-medium">Email address</label>
          <input
            id="waitlist-email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
            class="input input-bordered w-full"
          />
        </div>

        <label class="flex items-start gap-2 cursor-pointer">
          <input
            v-model="marketingOptIn"
            type="checkbox"
            class="checkbox checkbox-primary checkbox-sm mt-0.5"
          />
          <span class="text-base-content/70 text-sm">Send me product updates and tips (optional)</span>
        </label>

        <!-- Error -->
        <div v-if="error" class="text-error text-sm">{{ error }}</div>

        <button
          type="submit"
          :disabled="!email.trim() || submitting"
          class="btn btn-primary btn-block rounded-xl"
        >
          <svg v-if="submitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span v-else>Join the Waitlist</span>
        </button>
      </form>

      <!-- Success State -->
      <div v-else class="p-6 text-center space-y-4">
        <div class="bg-success/15 flex items-center justify-center w-14 h-14 mx-auto rounded-full">
          <svg class="text-success w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
        <h3 class="text-base-content font-serif text-xl font-light">You're on the list!</h3>
        <p class="text-base-content/70 text-sm">We'll email you as soon as Free+ is available.</p>
        <button @click="close" class="btn btn-primary btn-block rounded-xl">Done</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="close">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const email = ref('')
const marketingOptIn = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

const close = () => {
  emit('update:modelValue', false)
  // Reset form after a short delay so animation finishes
  setTimeout(() => {
    email.value = ''
    marketingOptIn.value = false
    submitting.value = false
    submitted.value = false
    error.value = ''
  }, 300)
}

const handleSubmit = async () => {
  if (!email.value.trim()) return

  submitting.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/v2/waitlist/free-plus', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        marketing_opt_in: marketingOptIn.value,
      },
    })

    if (response.success) {
      submitted.value = true
    }
  }
  catch (err: any) {
    error.value = err.data?.error || err.message || 'Something went wrong. Please try again.'
  }
  finally {
    submitting.value = false
  }
}
</script>
