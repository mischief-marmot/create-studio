<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <button class="btn btn-ghost" @click="$router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
      <div class="navbar-center">
        <h1 class="text-xl font-bold">Profile Settings</h1>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8 max-w-2xl">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-6">Profile Information</h2>
          
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Full Name</span>
              </label>
              <input
                v-model="profile.full_name"
                type="text"
                placeholder="Your full name"
                class="input input-bordered"
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Email</span>
              </label>
              <input
                :value="user?.email"
                type="email"
                class="input input-bordered"
                disabled
              />
              <label class="label">
                <span class="label-text-alt">Email cannot be changed here</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Avatar URL</span>
              </label>
              <input
                v-model="profile.avatar_url"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                class="input input-bordered"
              />
            </div>

            <div v-if="profile.avatar_url" class="form-control">
              <label class="label">
                <span class="label-text">Avatar Preview</span>
              </label>
              <div class="avatar">
                <div class="w-24 rounded-full">
                  <img :src="profile.avatar_url" :alt="profile.full_name" />
                </div>
              </div>
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
                :disabled="loading"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl mt-8">
        <div class="card-body">
          <h2 class="card-title mb-6">Account Settings</h2>
          
          <div class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Account Created</span>
              </label>
              <div class="text-sm">
                {{ new Date(user?.created_at).toLocaleDateString() }}
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Last Sign In</span>
              </label>
              <div class="text-sm">
                {{ new Date(user?.last_sign_in_at).toLocaleDateString() }}
              </div>
            </div>

            <div class="divider"></div>

            <button class="btn btn-error btn-outline" @click="handleLogout">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const profile = ref({
  full_name: '',
  avatar_url: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const updateProfile = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: profile.value.full_name,
        avatar_url: profile.value.avatar_url
      })
      .eq('id', user.value?.id)

    if (updateError) throw updateError

    success.value = 'Profile updated successfully!'
    
    // Update the user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: profile.value.full_name,
        avatar_url: profile.value.avatar_url
      }
    })

    if (authError) throw authError

  } catch (err: any) {
    error.value = err.message || 'An error occurred while updating profile'
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  await router.push('/')
}

const fetchProfile = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value?.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    
    if (data) {
      profile.value = {
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || ''
      }
    } else {
      // Use data from auth if profile doesn't exist
      profile.value = {
        full_name: user.value?.user_metadata?.full_name || '',
        avatar_url: user.value?.user_metadata?.avatar_url || ''
      }
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
  }
}

onMounted(() => {
  if (user.value) {
    fetchProfile()
  }
})
</script>