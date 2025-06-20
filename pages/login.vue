<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-center justify-center text-2xl mb-6">Sign In</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
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
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="input input-bordered"
              required
            />
            <label class="label">
              <NuxtLink to="/forgot-password" class="label-text-alt link link-hover">
                Forgot password?
              </NuxtLink>
            </label>
          </div>
          
          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>
          
          <div class="form-control mt-6">
            <button 
              type="submit" 
              class="btn btn-primary"
              :class="{ 'loading': loading }"
              :disabled="loading"
            >
              Sign In
            </button>
          </div>
        </form>
        
        <div class="divider">OR</div>
        
        <p class="text-center text-sm">
          Don't have an account?
          <NuxtLink to="/register" class="link link-primary">
            Sign up
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (signInError) throw signInError
    
    await router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message || 'An error occurred during sign in'
  } finally {
    loading.value = false
  }
}
</script>