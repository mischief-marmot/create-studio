<template>
  <NuxtLayout name="admin">
    <div class="min-h-screen bg-base-100">
      <main>
        <header>
          <!-- Secondary navigation -->
          <nav class="border-b border-base-300 flex py-4 overflow-x-auto">
            <ul role="list" class="gap-x-6 text-sm/6 sm:px-6 lg:px-8 flex flex-none min-w-full px-4 font-semibold text-base-content/60">
              <li>
                <a href="/admin/analytics" class="text-base-content/60 hover:text-primary">Analytics</a>
              </li>
              <li>
                <a href="/admin/reporting" class="text-primary">Reporting</a>
              </li>
            </ul>
          </nav>

          <!-- Heading -->
          <div class="gap-x-8 gap-y-4 bg-base-200/50 sm:flex-row sm:items-center sm:px-6 lg:px-8 flex flex-col items-start justify-between px-4 py-4">
            <div>
              <div class="gap-x-3 flex items-center">
                <div class="bg-info/10 flex-none p-1 text-info rounded-full">
                  <div class="size-2 bg-current rounded-full"></div>
                </div>
                <h1 class="gap-x-3 text-base/7 flex">
                  <span class="font-semibold text-base-content">User & Site Reports</span>
                </h1>
              </div>
              <p class="text-xs/6 mt-2 text-base-content/60">Detailed information about users, sites, and platform versions</p>
            </div>

            <button
              @click="fetchReporting"
              class="btn btn-sm btn-primary"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner loading-xs"></span>
              {{ loading ? 'Loading...' : 'Refresh Data' }}
            </button>
          </div>

          <!-- Stats Grid -->
          <div v-if="data" class="bg-base-200/50 sm:grid-cols-2 lg:grid-cols-4 grid grid-cols-1">
            <div class="border-t border-base-300 px-4 py-6 sm:px-6 lg:px-8">
              <p class="text-sm/6 font-medium text-base-content/60">Total Users</p>
              <p class="gap-x-2 flex items-baseline mt-2">
                <span class="text-4xl font-semibold tracking-tight text-info">{{ data.totalUsers }}</span>
              </p>
            </div>
            <div class="border-t sm:border-l border-base-300 px-4 py-6 sm:px-6 lg:px-8">
              <p class="text-sm/6 font-medium text-base-content/60">Total Sites</p>
              <p class="gap-x-2 flex items-baseline mt-2">
                <span class="text-4xl font-semibold tracking-tight text-success">{{ data.totalSites }}</span>
              </p>
            </div>
            <div class="border-t lg:border-l border-base-300 px-4 py-6 sm:px-6 lg:px-8">
              <p class="text-sm/6 font-medium text-base-content/60">Last Active User</p>
              <p class="gap-x-2 flex items-baseline mt-2">
                <span v-if="data.lastActiveUser" class="text-sm font-medium text-base-content">
                  {{ data.lastActiveUser.email }}
                </span>
                <span v-else class="text-sm text-base-content/60">No data</span>
              </p>
              <p v-if="data.lastActiveUser" class="text-xs text-base-content/60 mt-1">
                {{ formatDateTime(data.lastActiveUser.lastActiveAt) }}
              </p>
            </div>
            <div class="border-t sm:border-l border-base-300 px-4 py-6 sm:px-6 lg:px-8">
              <p class="text-sm/6 font-medium text-base-content/60">Last Active Site</p>
              <p class="gap-x-2 flex items-baseline mt-2">
                <span v-if="data.lastActiveSite" class="text-sm font-medium text-base-content">
                  {{ data.lastActiveSite.siteName || data.lastActiveSite.url }}
                </span>
                <span v-else class="text-sm text-base-content/60">No data</span>
              </p>
              <p v-if="data.lastActiveSite" class="text-xs text-base-content/60 mt-1">
                {{ formatDateTime(data.lastActiveSite.lastActiveAt) }}
              </p>
            </div>
          </div>
        </header>

        <!-- Loading State -->
        <div v-if="loading && !data" class="flex items-center justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Empty State -->
        <div v-else-if="!data" class="py-12 text-center">
          <p class="text-base-content/60">Click "Refresh Data" to load reporting information</p>
        </div>

        <!-- Reporting Details -->
        <div v-else class="pt-11 border-t border-base-300">
          <div class="sm:px-6 lg:px-8 px-4 space-y-8 pb-8">
            <!-- Users Per Site Section -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title mb-4 text-2xl">Users Per Site</h2>

                <div v-if="data.usersPerSite.length === 0" class="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="shrink-0 w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>No sites with users found</span>
                </div>

                <div v-else class="overflow-x-auto">
                  <table class="table-zebra table">
                    <thead>
                      <tr>
                        <th>Site ID</th>
                        <th>Site Name</th>
                        <th>URL</th>
                        <th>User Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="site in data.usersPerSite" :key="site.siteId">
                        <td>{{ site.siteId }}</td>
                        <td>{{ site.siteName || '-' }}</td>
                        <td class="font-mono text-sm">{{ site.url || '-' }}</td>
                        <td>
                          <span class="badge badge-info">{{ site.userCount }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Version Information Section -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title mb-4 text-2xl">WordPress, PHP, and Create Plugin Versions</h2>

                <div v-if="data.versionInfo.length === 0" class="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="shrink-0 w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>No version information available</span>
                </div>

                <div v-else class="overflow-x-auto">
                  <table class="table-zebra table">
                    <thead>
                      <tr>
                        <th>Site ID</th>
                        <th>Site Name</th>
                        <th>URL</th>
                        <th>WordPress</th>
                        <th>PHP</th>
                        <th>Create Plugin</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="site in data.versionInfo" :key="site.siteId">
                        <td>{{ site.siteId }}</td>
                        <td>{{ site.siteName || '-' }}</td>
                        <td class="font-mono text-sm">{{ site.url || '-' }}</td>
                        <td>
                          <span v-if="site.wpVersion" class="badge badge-primary">{{ site.wpVersion }}</span>
                          <span v-else class="text-base-content/40">-</span>
                        </td>
                        <td>
                          <span v-if="site.phpVersion" class="badge badge-secondary">{{ site.phpVersion }}</span>
                          <span v-else class="text-base-content/40">-</span>
                        </td>
                        <td>
                          <span v-if="site.createVersion" class="badge badge-accent">{{ site.createVersion }}</span>
                          <span v-else class="text-base-content/40">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'auth' // Ensure only authenticated users can access
})

const loading = ref(false)
const data = ref<any>(null)

// Fetch reporting data
const fetchReporting = async () => {
  loading.value = true

  try {
    const response = await $fetch('/api/analytics/reporting')
    data.value = response
  } catch (error) {
    console.error('Error fetching reporting data:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
  }
}

// Format date/time helper
const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return '-'

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Auto-load data on mount
onMounted(() => {
  fetchReporting()
})
</script>
