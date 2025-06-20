<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-center justify-center text-2xl mb-6">Reset Password</h2>
        
        <p class="text-sm text-center mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form @submit.prevent="handleResetPassword" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Email</span>
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="input input-bordered"
              required
            />
          </div>
          
          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>
          
          <div v-if="success" class="alert alert-success">
            <span>{{ success }}</span>
          </div>
          
          <div class="form-control mt-6">
            <button 
              type="submit" 
              class="btn btn-primary"
              :class="{ 'loading': loading }"
              :disabled="loading || success"
            >
              Send Reset Link
            </button>
          </div>
        </form>
        
        <div class="divider">OR</div>
        
        <p class="text-center text-sm">
          Remember your password?
          <NuxtLink to="/login" class="link link-primary">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const config = useRuntimeConfig()

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleResetPassword = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${config.public.siteUrl}/reset-password`
    })
    
    if (resetError) throw resetError
    
    success.value = 'Password reset link sent! Please check your email.'
  } catch (err: any) {
    error.value = err.message || 'An error occurred while sending the reset link'
  } finally {
    loading.value = false
  }
}
</script>