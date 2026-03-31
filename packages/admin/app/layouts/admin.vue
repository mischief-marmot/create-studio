<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  GlobeAltIcon,
  MegaphoneIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowLeftStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const { adminUser, logout, isAuthenticated } = useAdminAuth()
const { environment, fetchEnvironment } = useAdminEnvironment()
const { currentTheme, initializeTheme, toggleTheme } = useAdminTheme()

// Mobile drawer state
const isDrawerOpen = ref(false)

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCardIcon },
  { name: 'Sites', href: '/sites', icon: GlobeAltIcon },
  { name: 'Broadcasts', href: '/broadcasts', icon: MegaphoneIcon },
  { name: 'Plugin Releases', href: '/plugin-releases', icon: ArrowDownTrayIcon },
  { name: 'Release Emails', href: '/release-emails', icon: EnvelopeIcon },
  { name: 'Feedback', href: '/feedback', icon: ChatBubbleLeftEllipsisIcon },
  { name: 'CRM', href: '/crm', icon: UserGroupIcon },
  { name: 'Audit Logs', href: '/audit-logs', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
]

// Check if route is active
const isActiveRoute = (href: string) => {
  if (href === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(href)
}

// Initialize theme and environment
onMounted(() => {
  initializeTheme()
  fetchEnvironment()
})

// Close drawer when route changes
watch(() => route.path, () => {
  isDrawerOpen.value = false
})

// Get admin display name
const adminDisplayName = computed(() => {
  if (!adminUser.value) return 'Admin'
  if (adminUser.value.firstname && adminUser.value.lastname) {
    return `${adminUser.value.firstname} ${adminUser.value.lastname}`
  }
  if (adminUser.value.firstname) {
    return adminUser.value.firstname
  }
  return adminUser.value.email.split('@')[0]
})

// Handle logout
const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <!-- Mobile header -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-base-200 border-b border-base-300">
      <div class="navbar px-4">
        <div class="flex-none">
          <button
            class="btn btn-square btn-ghost"
            @click="isDrawerOpen = !isDrawerOpen"
            aria-label="Toggle menu"
          >
            <Bars3Icon v-if="!isDrawerOpen" class="h-6 w-6" />
            <XMarkIcon v-else class="h-6 w-6" />
          </button>
        </div>
        <div class="flex-1">
          <h1 class="text-lg font-bold">Create Studio Admin</h1>
        </div>
        <div class="flex-none flex items-center gap-2">
          <ClientOnly>
            <AdminEnvironmentSelector />
          </ClientOnly>
          <button
            class="btn btn-square btn-ghost"
            @click="toggleTheme"
            aria-label="Toggle theme"
          >
            <SunIcon v-if="currentTheme === 'light'" class="h-6 w-6" />
            <MoonIcon v-else class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile drawer -->
    <div
      v-if="isDrawerOpen"
      class="lg:hidden fixed inset-0 z-40 bg-black/50"
      @click="isDrawerOpen = false"
    />
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-[280px] bg-base-200 border-r border-base-300 transform transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 flex flex-col',
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo/Branding -->
      <div class="p-6 border-b border-base-300">
        <h1 class="font-bold text-xl text-base-content flex items-center gap-2">
          Create Studio Admin
          <ClientOnly>
            <span
              class="size-2 rounded-full"
              :class="environment === 'production' ? 'bg-success' : 'bg-warning'"
              :title="`${environment.charAt(0).toUpperCase() + environment.slice(1)} environment`"
            ></span>
          </ClientOnly>
        </h1>
        <p class="text-sm text-base-content/60 mt-1">Management Portal</p>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 overflow-y-auto">
        <ul class="menu menu-sm lg:menu-md gap-1">
          <li v-for="item in navigation" :key="item.name">
            <NuxtLink
              :to="item.href"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActiveRoute(item.href)
                  ? 'bg-primary text-primary-content font-semibold shadow-sm'
                  : 'text-base-content hover:bg-base-300',
              ]"
            >
              <component :is="item.icon" class="h-5 w-5" />
              <span>{{ item.name }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Admin profile section -->
      <div class="p-4 border-t border-base-300">
        <div class="dropdown dropdown-top dropdown-end w-full">
          <div
            tabindex="0"
            role="button"
            class="btn btn-ghost w-full justify-start gap-3 px-4"
          >
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-10">
                <span class="text-sm">{{ adminDisplayName.charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            <div class="flex flex-col items-start flex-1 min-w-0">
              <span class="font-semibold text-sm truncate w-full text-left">{{ adminDisplayName }}</span>
              <span class="text-xs text-base-content/60 truncate w-full text-left">{{ adminUser?.email }}</span>
            </div>
          </div>
          <ul
            tabindex="0"
            class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300 mb-2"
          >
            <li>
              <button @click="handleLogout" class="flex items-center gap-2 text-error">
                <ArrowLeftStartOnRectangleIcon class="h-5 w-5" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>

    <!-- Desktop header -->
    <div class="hidden lg:block fixed top-0 left-[280px] right-0 z-30 bg-base-200 border-b border-base-300">
      <div class="navbar px-6">
        <div class="flex-1">
          <!-- Breadcrumb or page title could go here -->
        </div>
        <div class="flex-none flex items-center gap-2">
          <ClientOnly>
            <AdminEnvironmentSelector />
          </ClientOnly>
          <button
            class="btn btn-square btn-ghost"
            @click="toggleTheme"
            aria-label="Toggle theme"
          >
            <SunIcon v-if="currentTheme === 'light'" class="h-6 w-6" />
            <MoonIcon v-else class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <main
      :class="[
        'transition-all duration-300',
        'pt-16 lg:pt-[4rem]',
        'lg:ml-[280px]',
      ]"
    >
      <!-- Environment warning banner -->
      <ClientOnly>
        <div v-if="environment === 'preview'" class="bg-warning/10 border-b border-warning/20 px-4 py-2 text-warning text-sm text-center">
          You are viewing <strong>Preview</strong> environment data
        </div>
      </ClientOnly>
      <div class="p-6">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Smooth transitions */
.transform {
  transform: translateZ(0);
}

/* Custom scrollbar for navigation */
nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.2);
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.3);
}
</style>
