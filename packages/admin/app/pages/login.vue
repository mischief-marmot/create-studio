<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { login, error: authError, clearError } = useAdminAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const emailError = ref('')
const passwordError = ref('')

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate form fields
function validateForm(): boolean {
  let isValid = true

  // Clear previous errors
  emailError.value = ''
  passwordError.value = ''
  error.value = ''

  // Validate email
  if (!email.value) {
    emailError.value = 'Email is required'
    isValid = false
  } else if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address'
    isValid = false
  }

  // Validate password
  if (!password.value) {
    passwordError.value = 'Password is required'
    isValid = false
  }

  return isValid
}

// Handle login submission
async function handleLogin() {
  // Validate form
  if (!validateForm()) {
    return
  }

  // Clear any previous errors
  error.value = ''
  clearError()

  // Set loading state
  loading.value = true

  try {
    // Attempt login
    const success = await login(email.value, password.value)

    if (success) {
      // Redirect to dashboard on success
      await navigateTo('/')
    } else {
      // Show error from auth composable
      error.value = authError.value || 'Login failed. Please try again.'
    }
  } catch (err: any) {
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

// Handle form submission via Enter key
function handleSubmit(e: Event) {
  e.preventDefault()
  handleLogin()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
    <div class="w-full max-w-md">
      <!-- Branding -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-base-content">Create Studio Admin</h1>
        <p class="text-base-content/60 mt-2">Sign in to access the admin portal</p>
      </div>

      <!-- Login Card -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <!-- Error Alert -->
          <div v-if="error" class="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- Login Form -->
          <form @submit="handleSubmit">
            <!-- Email Field -->
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text font-medium">Email</span>
              </label>
              <input
                v-model="email"
                type="email"
                placeholder="admin@example.com"
                class="input input-bordered w-full"
                :class="{ 'input-error': emailError }"
                :disabled="loading"
                autocomplete="email"
              />
              <label v-if="emailError" class="label">
                <span class="label-text-alt text-error">{{ emailError }}</span>
              </label>
            </div>

            <!-- Password Field -->
            <div class="form-control mb-6">
              <label class="label">
                <span class="label-text font-medium">Password</span>
              </label>
              <input
                v-model="password"
                type="password"
                placeholder="Enter your password"
                class="input input-bordered w-full"
                :class="{ 'input-error': passwordError }"
                :disabled="loading"
                autocomplete="current-password"
              />
              <label v-if="passwordError" class="label">
                <span class="label-text-alt text-error">{{ passwordError }}</span>
              </label>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn btn-primary w-full"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner"></span>
              <span v-else>Sign In</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
