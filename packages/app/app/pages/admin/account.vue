<template>
  <div>
    <h1 class="sr-only">Account Settings</h1>

    <header class="border-b border-base-300">
      <!-- Secondary navigation -->
      <nav class="flex overflow-x-auto py-4">
        <ul role="list" class="flex min-w-full flex-none gap-x-6 px-4 text-sm font-semibold sm:px-6 lg:px-8">
          <li>
            <a href="" class="text-accent">Profile</a>
          </li>
        </ul>
      </nav>
    </header>

    <!-- Settings forms -->
    <div class="divide-y divide-base-300">
      <!-- Personal Information Section -->
      <div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 class="text-base font-semibold">Personal Information</h2>
          <p class="mt-1 text-sm text-base-content/70">Update your personal details and profile information.</p>
        </div>

        <form @submit.prevent="handleSaveProfile" class="md:col-span-2">
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
            <!-- Avatar -->
            <div class="col-span-full flex items-center gap-x-8">
              <div class="avatar">
                <div class="w-24 rounded-lg bg-base-300">
                  <img v-if="avatarUrl" :src="avatarUrl" :alt="`${profileForm.firstname} avatar`" class="object-cover" />
                  <div v-else class="flex items-center justify-center h-full text-3xl font-semibold">
                    {{ initials }}
                  </div>
                </div>
              </div>
              <div>
                <label class="btn btn-sm btn-primary">
                  <span v-if="uploading" class="loading loading-spinner loading-xs"></span>
                  {{ uploading ? 'Uploading...' : 'Change avatar' }}
                  <input
                    type="file"
                    class="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    @change="handleAvatarUpload"
                    :disabled="uploading"
                  />
                </label>
                <p class="mt-2 text-xs text-base-content/70">
                  JPG, PNG, GIF or WebP. 2MB max.
                  <span v-if="avatarType === 'gravatar'" class="block text-info mt-1">Using Gravatar</span>
                </p>
                <p v-if="avatarError" class="mt-2 text-xs text-error">{{ avatarError }}</p>
              </div>
            </div>

            <div class="sm:col-span-3">
              <label class="label">
                <span class="label-text font-medium">First name</span>
              </label>
              <input
                v-model="profileForm.firstname"
                type="text"
                class="input input-bordered w-full"
                placeholder="John"
              />
            </div>

            <div class="sm:col-span-3">
              <label class="label">
                <span class="label-text font-medium">Last name</span>
              </label>
              <input
                v-model="profileForm.lastname"
                type="text"
                class="input input-bordered w-full"
                placeholder="Doe"
              />
            </div>

            <div class="col-span-full">
              <label class="label">
                <span class="label-text font-medium">Email address</span>
              </label>
              <input
                v-model="profileForm.email"
                type="email"
                class="input input-bordered w-full"
                placeholder="you@example.com"
              />
              <label class="label">
                <span v-if="user?.validEmail" class="label-text-alt text-success">✓ Verified</span>
                <span v-else class="label-text-alt text-warning">Email not verified</span>
              </label>
            </div>
          </div>

          <div v-if="profileError" class="alert alert-error mt-6">
            <span>{{ profileError }}</span>
          </div>

          <div v-if="profileSuccess" class="alert alert-success mt-6">
            <span>Profile updated successfully!</span>
          </div>

          <div class="mt-8 flex">
            <button type="submit" class="btn btn-primary" :disabled="savingProfile">
              <span v-if="savingProfile" class="loading loading-spinner"></span>
              {{ savingProfile ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Change Password Section -->
      <div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 class="text-base font-semibold">Change password</h2>
          <p class="mt-1 text-sm text-base-content/70">Update your password associated with your account.</p>
        </div>

        <form @submit.prevent="handleChangePassword" class="md:col-span-2">
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
            <div class="col-span-full">
              <label class="label">
                <span class="label-text font-medium">Current password</span>
              </label>
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                class="input input-bordered w-full"
                autocomplete="current-password"
              />
            </div>

            <div class="col-span-full">
              <label class="label">
                <span class="label-text font-medium">New password</span>
              </label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                class="input input-bordered w-full"
                autocomplete="new-password"
                minlength="8"
              />
              <label class="label">
                <span class="label-text-alt">Minimum 8 characters</span>
              </label>
            </div>

            <div class="col-span-full">
              <label class="label">
                <span class="label-text font-medium">Confirm password</span>
              </label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                class="input input-bordered w-full"
                autocomplete="new-password"
              />
            </div>
          </div>

          <div v-if="passwordError" class="alert alert-error mt-6">
            <span>{{ passwordError }}</span>
          </div>

          <div v-if="passwordSuccess" class="alert alert-success mt-6">
            <span>Password changed successfully!</span>
          </div>

          <div class="mt-8 flex">
            <button type="submit" class="btn btn-primary" :disabled="changingPassword">
              <span v-if="changingPassword" class="loading loading-spinner"></span>
              {{ changingPassword ? 'Changing...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Delete Account Section -->
      <div class="hidden grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 class="text-base font-semibold text-error">Delete account</h2>
          <p class="mt-1 text-sm text-base-content/70">
            No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently.
          </p>
        </div>

        <form class="flex items-start md:col-span-2" @submit.prevent="showDeleteConfirm = true">
          <button type="submit" class="btn btn-error">
            Yes, delete my account
          </button>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <dialog :class="{ 'modal modal-open': showDeleteConfirm }" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Delete Account</h3>
        <p class="py-4">
          Are you sure you want to delete your account? This will permanently delete all your sites and data. This action cannot be undone.
        </p>
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Type <strong>DELETE</strong> to confirm</span>
          </label>
          <input
            v-model="deleteConfirmText"
            type="text"
            class="input input-bordered"
            placeholder="DELETE"
          />
        </div>
        <div class="modal-action">
          <button class="btn" @click="showDeleteConfirm = false">Cancel</button>
          <button
            class="btn btn-error"
            :disabled="deleteConfirmText !== 'DELETE'"
            @click="handleDeleteAccount"
          >
            Delete Account
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showDeleteConfirm = false">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useAuthFetch } from '~/composables/useAuthFetch'
import { useAvatar } from '~/composables/useAvatar'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const router = useRouter()
const { user, logout } = useAuth()

const profileForm = ref({
  firstname: '',
  lastname: '',
  email: '',
  avatar: ''
})

// Avatar composable with reactive options
const avatarOptions = reactive({
  email: '',
  firstname: '',
  lastname: '',
  avatar: ''
})

const { avatarUrl, avatarType, initials, uploadAvatar, deleteAvatar } = useAvatar(avatarOptions)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const savingProfile = ref(false)
const changingPassword = ref(false)
const showDeleteConfirm = ref(false)
const deleteConfirmText = ref('')
const uploading = ref(false)

const profileError = ref('')
const profileSuccess = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)
const avatarError = ref('')

const loadUserData = () => {
  if (user.value) {
    profileForm.value = {
      firstname: user.value.firstname || '',
      lastname: user.value.lastname || '',
      email: user.value.email || '',
      avatar: user.value.avatar || ''
    }

    // Update avatar options
    avatarOptions.email = user.value.email || ''
    avatarOptions.firstname = user.value.firstname || ''
    avatarOptions.lastname = user.value.lastname || ''
    avatarOptions.avatar = user.value.avatar || ''
  }
}

const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  avatarError.value = ''
  uploading.value = true

  try {
    const result = await uploadAvatar(file)

    if (result.success) {
      // Update form
      profileForm.value.avatar = result.url || ''
      avatarOptions.avatar = result.url || ''

      // Update user in auth
      if (user.value) {
        user.value.avatar = result.url || ''
      }
    } else {
      avatarError.value = result.error || 'Failed to upload avatar'
    }
  } catch (error: any) {
    avatarError.value = error.message || 'Failed to upload avatar'
  } finally {
    uploading.value = false
    // Reset input
    input.value = ''
  }
}

const handleDeleteAvatar = async () => {
  avatarError.value = ''
  uploading.value = true

  try {
    const result = await deleteAvatar()

    if (result.success) {
      // Update form
      profileForm.value.avatar = ''
      avatarOptions.avatar = ''

      // Update user in auth
      if (user.value) {
        user.value.avatar = ''
      }
    } else {
      avatarError.value = result.error || 'Failed to delete avatar'
    }
  } catch (error: any) {
    avatarError.value = error.message || 'Failed to delete avatar'
  } finally {
    uploading.value = false
  }
}

const handleSaveProfile = async () => {
  profileError.value = ''
  profileSuccess.value = false
  savingProfile.value = true

  try {
    // TODO: Create PATCH endpoint for updating user
    const response = await useAuthFetch(`/api/v2/users/${user.value?.id}`, {
      method: 'PATCH',
      body: {
        firstname: profileForm.value.firstname,
        lastname: profileForm.value.lastname,
        email: profileForm.value.email,
        avatar: profileForm.value.avatar
      }
    })

    if (response.success) {
      profileSuccess.value = true
      setTimeout(() => {
        profileSuccess.value = false
      }, 3000)
    } else {
      profileError.value = response.error || 'Failed to update profile'
    }
  } catch (error: any) {
    profileError.value = error.data?.error || 'Failed to update profile'
  } finally {
    savingProfile.value = false
  }
}

const handleChangePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = false

  // Validation
  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    return
  }

  changingPassword.value = true

  try {
    // TODO: Create endpoint for changing password
    const response = await useAuthFetch('/api/v2/users/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      }
    })

    if (response.success) {
      passwordSuccess.value = true
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      setTimeout(() => {
        passwordSuccess.value = false
      }, 3000)
    } else {
      passwordError.value = response.error || 'Failed to change password'
    }
  } catch (error: any) {
    passwordError.value = error.data?.error || 'Failed to change password'
  } finally {
    changingPassword.value = false
  }
}

const handleDeleteAccount = async () => {
  // TODO: Implement account deletion
  console.log('Delete account')
  showDeleteConfirm.value = false
  await logout()
}

onMounted(() => {
  loadUserData()
})

useHead({
  title: 'Account Settings - Create Studio',
  meta: [
    { name: 'description', content: 'Manage your account settings' }
  ]
})
</script>
