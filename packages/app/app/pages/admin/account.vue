<template>
  <div class="min-h-screen">
    <!-- Page Header -->
    <header class="px-4">
      <div :class="scrollPosition ? '' : 'lg:pt-10'"
        class=" backdrop-blur-xl bg-base-100/80 border-base-300/60 md:sticky top-0 z-10 max-w-4xl py-4 mx-auto border-b">
        <div class="breadcrumbs text-xs">
          <ul>
            <li>
              <NuxtLink to="/admin" class="font-thin">Dashboard</NuxtLink>
            </li>
            <li class="font-light">Account Settings</li>
          </ul>
        </div>
        <h1 :class="scrollPosition ? '' : 'lg:text-5xl'" class="text-base-content font-serif text-2xl">Account
          Settings</h1>
        <p class="text-base-content/70">Manage your <span class="text-primary-content dark:text-primary italic">personal
            profile</span></p>
      </div>

      <!-- Profile Card -->
      <div
        class="rounded-3xl bg-gradient-to-br from-base-100/20 via-base-100/50 to-base-200 animate-scaleIn border-base-300 sm:p-8 max-w-4xl p-4 mx-auto my-8 mb-8 border">
        <div class="sm:flex-col sm:text-center flex items-center gap-8">
          <div class="relative flex-shrink-0">
            <div class="size-28 rounded-2xl overflow-hidden">
              <img v-if="avatarUrl" :src="avatarUrl" :alt="`${profileForm.firstname} avatar`"
                class="object-cover w-full h-full" />
              <div v-else
                class="size-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-3xl font-semibold text-white">
                {{ initials }}
              </div>
            </div>
            <label
              class="-bottom-2 -right-2 size-9 hover:bg-primary hover:text-primary-content hover:border-primary-content bg-base-300 border-base-content absolute flex items-center justify-center transition-all border rounded-full cursor-pointer"
              :class="{ 'opacity-50 cursor-not-allowed': uploading }">
              <span v-if="uploading"
                class="border-primary-content/30 border-t-primary-content animate-spin w-5 h-5 border-2 rounded-full"></span>
              <CameraIcon v-else class="size-5" />
              <input type="file" class="hidden" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                @change="handleAvatarUpload" :disabled="uploading" />
            </label>
          </div>
          <caption v-if="!avatarUrl" class="text-base-content/70 -mt-6 text-xs" >Upload a profile picture</caption>

          <div>
            <h2 class="font-serif text-3xl italic font-light">{{ user.firstname }} {{ user.lastname }}</h2>
            <p class="text-base-content/70 text-sm">{{ user.email }}</p>
            <div class="sm:justify-center flex flex-wrap gap-2 mt-4">
              <!-- <span v-if="user.validEmail"
                class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Verified
              </span> -->
              <span
                class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-md">
                Registered {{ formatDate(user.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <nav class=" max-w-4xl pb-6 mx-auto mt-6">
        <div class="flex gap-6">
          <button v-for="item in secondaryNavigation" :key="item.id" @click="setActiveTab(item.id)"
            class="gap-1.5 py-1 text-sm flex items-center flex-0 justify-center border-b-2 cursor-pointer"
            :class="item.current ? 'border-primary text-base-content dark:text-primary' : 'border-transparent text-base-content/70 hover:border-primary/50'">
            <component :is="item.icon" class="w-4 h-4" />
            {{ item.name }}
          </button>
        </div>
      </nav>
    </header>

    <!-- Account Content -->
    <div class="max-w-4xl px-4 py-10 mx-auto space-y-16">
      <!-- Profile Tab -->
      <section v-show="activeTab === 'profile'" class="w-full">
        <div class="gap-10">
          <!-- Section Form -->
          <div class="">
            <div class="bg-base-100 border-base-300 rounded-3xl overflow-hidden border-2">
              <div class="lg:p-16 p-6">
                <form @submit.prevent="handleSaveProfile" class="space-y-8">
                  <div>
                    <h2 class="text-base-content font-serif text-lg leading-tight">Personal Information</h2>
                    <p class="text-base-content/70 text-sm">
                      Update your personal details and profile information.
                    </p>
                  </div>
                  <!-- Name Fields -->
                  <div class="flex gap-6">
                    <div class="space-y-2">
                      <label class="block">
                        <span class="text-base-content block text-sm">First name</span>
                      </label>
                      <input v-model="profileForm.firstname" type="text" class="bg-base-200 input" placeholder="Sabrina" />
                    </div>

                    <div class="space-y-2">
                      <label class="block">
                        <span class="text-base-content blocktext-sm ">Last name</span>
                      </label>
                      <input v-model="profileForm.lastname" type="text" class="bg-base-200 input" placeholder="Doe" />
                    </div>
                  </div>

                  <!-- Email Field -->
                  <div class="space-y-2">
                    <label class="flex items-center gap-2">
                      <span class="text-base-content block text-sm">Email address</span>
                      <span class="flex items-center gap-2">
                        <span v-if="user?.validEmail"
                          class="text-success flex items-center gap-1.5 text-sm font-medium">
                          <CheckCircleIcon class="w-4 h-4" />
                          Verified
                        </span>
                        <span v-else class="text-warning flex items-center gap-1.5 text-sm font-medium">
                          <ExclamationTriangleIcon class="w-4 h-4" />
                          Email not verified
                        </span>
                      </span>
                    </label>
                    <input v-model="profileForm.email" type="email" class="bg-base-200 input"
                      placeholder="you@example.com" />
                  </div>

                  <!-- Alerts -->
                  <div v-if="profileError" role="alert" class="alert alert-error">
                    <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {{ profileError }}
                  </div>

                  <div v-if="profileSuccess" role="alert" class="alert alert-success">
                    <CheckCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
                    Profile updated successfully!
                  </div>

                  <!-- Submit -->
                  <div class="border-base-300 flex justify-end pt-6 border-t-2">
                    <button type="submit" class="btn btn-primary btn-lg" :disabled="savingProfile">
                      <span v-if="savingProfile"
                        class="border-primary-content/30 border-t-primary-content animate-spin w-5 h-5 border-2 rounded-full"></span>
                      {{ savingProfile ? 'Saving...' : 'Save changes' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Security Tab -->
      <section v-show="activeTab === 'security'" class="w-full">
        <div class="gap-10">
          <!-- Section Form -->
          <div class="">
            <div class="bg-base-100 border-base-300 rounded-3xl overflow-hidden border-2">
              <div class="lg:p-16 p-6">
                <h2 class="text-base-content font-serif text-lg leading-tight">Change Password</h2>
                <p class="text-base-content/70 text-sm">
                  Keep your account secure by using a strong password that you don't use elsewhere.
                </p>
                <form @submit.prevent="handleChangePassword" class="space-y-8">
                  <div class="space-y-3">
                    <label class="block">
                      <span class="text-base-content block mb-2 text-sm font-bold">Current password</span>
                    </label>
                    <input v-model="passwordForm.currentPassword" type="password"
                      class="bg-base-200 border-2 border-base-300 text-base-content rounded-2xl w-full px-5 py-3.5 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      autocomplete="current-password" />
                  </div>

                  <div class="space-y-3">
                    <label class="block">
                      <span class="text-base-content block mb-2 text-sm font-bold">New password</span>
                    </label>
                    <input v-model="passwordForm.newPassword" type="password"
                      class="bg-base-200 border-2 border-base-300 text-base-content rounded-2xl w-full px-5 py-3.5 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      autocomplete="new-password" minlength="8" />
                    <p class="text-base-content/60 text-sm">Minimum 8 characters</p>
                  </div>

                  <div class="space-y-3">
                    <label class="block">
                      <span class="text-base-content block mb-2 text-sm font-bold">Confirm new password</span>
                    </label>
                    <input v-model="passwordForm.confirmPassword" type="password"
                      class="bg-base-200 border-2 border-base-300 text-base-content rounded-2xl w-full px-5 py-3.5 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      autocomplete="new-password" />
                  </div>

                  <!-- Alerts -->
                  <div v-if="passwordError"
                    class="bg-error/10 border-error/30 text-error rounded-2xl flex items-start gap-3 p-5 border-2">
                    <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span class="font-medium">{{ passwordError }}</span>
                  </div>

                  <div v-if="passwordSuccess"
                    class="bg-success/10 border-success/30 text-success rounded-2xl flex items-start gap-3 p-5 border-2">
                    <CheckCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span class="font-medium">Password changed successfully!</span>
                  </div>

                  <!-- Submit -->
                  <div class="border-base-300 flex justify-end pt-6 border-t-2">
                    <button type="submit"
                      class="bg-primary hover:bg-primary-focus disabled:opacity-50 disabled:cursor-not-allowed text-primary-content rounded-full px-8 py-3.5 font-bold flex items-center gap-3 transition-all duration-300 shadow-lg  hover:shadow-xl hover: hover:scale-105"
                      :disabled="changingPassword">
                      <span v-if="changingPassword"
                        class="border-primary-content/30 border-t-primary-content animate-spin w-5 h-5 border-2 rounded-full"></span>
                      <KeyIcon v-else class="w-5 h-5" />
                      {{ changingPassword ? 'Changing...' : 'Update password' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Danger Zone (Hidden for now) -->
      <section v-if="false" class="w-full">
        <div class="lg:grid-cols-3 grid grid-cols-1 gap-8">
          <div class="lg:col-span-1">
            <h2 class="text-error mb-2 font-serif text-xl font-bold">Danger Zone</h2>
            <p class="text-base-content/60 text-sm leading-relaxed">
              Irreversible actions. Once you delete your account, there is no going back.
            </p>
          </div>

          <div class="lg:col-span-2">
            <div class="card bg-error/5 border-error/20 border">
              <div class="card-body">
                <p class="opacity-70 mb-4 text-sm">
                  This will permanently delete all your sites and data. This action cannot be undone.
                </p>
                <button type="button" class="btn btn-error btn-outline" @click="showDeleteConfirm = true">
                  Delete my account
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Delete Confirmation Modal -->
    <dialog :class="{ 'modal modal-open': showDeleteConfirm }" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Delete Account</h3>
        <p class="opacity-70 py-4">
          Are you sure you want to delete your account? This will permanently delete all your sites and data.
        </p>
        <div class="form-control mb-4 space-y-2">
          <label class="label">
            <span class="label-text">Type <strong class="text-error">DELETE</strong> to confirm</span>
          </label>
          <input v-model="deleteConfirmText" type="text" class="input input-bordered" placeholder="DELETE" />
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showDeleteConfirm = false">Cancel</button>
          <button class="btn btn-error" :disabled="deleteConfirmText !== 'DELETE'" @click="handleDeleteAccount">
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
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  LockClosedIcon,
  CameraIcon,
} from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth'
import { useAuthFetch } from '~/composables/useAuthFetch'
import { useAvatar } from '~/composables/useAvatar'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const { user, logout } = useAuth()
const scrollPosition = ref(0)
const activeTab = ref('profile')

const secondaryNavigation = computed(() => [
  { name: 'Profile', id: 'profile', icon: UserCircleIcon, current: activeTab.value === 'profile' },
  { name: 'Security', id: 'security', icon: LockClosedIcon, current: activeTab.value === 'security' },
])

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
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

const { avatarUrl, initials, uploadAvatar } = useAvatar(avatarOptions)

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
      profileForm.value.avatar = result.url || ''
      avatarOptions.avatar = result.url || ''

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
    input.value = ''
  }
}

const handleSaveProfile = async () => {
  profileError.value = ''
  profileSuccess.value = false
  savingProfile.value = true

  try {
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
  console.log('Delete account')
  showDeleteConfirm.value = false
  await logout()
}

onMounted(() => {
  loadUserData()
  scrollPosition.value = window.scrollY

  const handleScroll = () => {
    scrollPosition.value = window.scrollY
  }
  window.addEventListener('scroll', handleScroll)
})

useHead({
  title: 'Account Settings - Create Studio',
  meta: [
    { name: 'description', content: 'Manage your account settings' }
  ]
})
</script>
