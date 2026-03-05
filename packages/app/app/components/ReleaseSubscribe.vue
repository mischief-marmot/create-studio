<template>
  <div class="bg-base-200 rounded-2xl px-6 py-8 ring-1 ring-base-content/5 max-w-lg mx-auto">
    <h3 class="text-lg font-semibold text-base-content text-center">Get notified of new releases</h3>
    <p class="text-sm text-base-content/60 text-center mt-1">We'll email you when we ship something new.</p>

    <form v-if="!submitted" class="mt-6 space-y-4" @submit.prevent="subscribe">
      <!-- Email -->
      <input
        v-model="email"
        type="email"
        placeholder="you@example.com"
        class="input input-bordered w-full"
        required
      />

      <!-- Product checkboxes -->
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="products" type="checkbox" value="create-plugin" class="checkbox checkbox-sm checkbox-primary" />
          <span class="text-sm text-base-content">Create Plugin</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="products" type="checkbox" value="create-studio" class="checkbox checkbox-sm checkbox-primary" />
          <span class="text-sm text-base-content">Create Studio</span>
        </label>
      </div>

      <!-- Marketing opt-in -->
      <label class="flex items-start gap-2 cursor-pointer">
        <input v-model="marketingOptIn" type="checkbox" class="checkbox checkbox-xs mt-0.5" />
        <span class="text-xs text-base-content/50">I'd also like to receive occasional product updates and tips.</span>
      </label>

      <!-- Submit -->
      <button
        type="submit"
        class="btn btn-primary w-full"
        :disabled="loading || !email || products.length === 0"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        {{ loading ? 'Subscribing...' : 'Subscribe to Release Notes' }}
      </button>

      <p v-if="error" class="text-sm text-error text-center">{{ error }}</p>
    </form>

    <!-- Success state -->
    <div v-else class="mt-6 text-center">
      <div class="text-3xl mb-2">&#10003;</div>
      <p class="text-base-content font-medium">{{ alreadySubscribed ? "You're already subscribed!" : "You're subscribed!" }}</p>
      <p class="text-sm text-base-content/60 mt-1">We'll let you know when something new ships.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const email = ref('')
const products = ref<string[]>(['create-plugin', 'create-studio'])
const marketingOptIn = ref(false)
const loading = ref(false)
const submitted = ref(false)
const alreadySubscribed = ref(false)
const error = ref('')

const subscribe = async () => {
  loading.value = true
  error.value = ''

  try {
    const res = await $fetch('/api/v2/releases/subscribe', {
      method: 'POST',
      body: {
        email: email.value,
        products: products.value,
        marketing_opt_in: marketingOptIn.value,
      },
    })

    if (res.success) {
      submitted.value = true
      alreadySubscribed.value = res.alreadySubscribed ?? false
    }
    else {
      error.value = (res as any).error || 'Something went wrong. Please try again.'
    }
  }
  catch (e: any) {
    error.value = e?.data?.error || 'Something went wrong. Please try again.'
  }
  finally {
    loading.value = false
  }
}
</script>
