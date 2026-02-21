<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm text-base-content/50 font-light tracking-wide">Loading dashboard...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[60vh]">
      <div class="max-w-md text-center space-y-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
          <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="space-y-2">
          <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Dashboard</h3>
          <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchDashboardData">
          Try Again
        </button>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="stats" class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Overview</span>
        </div>
        <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
          Dashboard
        </h1>
      </div>

      <!-- Stats Grid -->
      <div class="space-y-8">
        <!-- Users Section -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Users
            </h2>
            <NuxtLink
              to="/users"
              class="text-sm text-base-content/60 hover:text-primary transition-colors flex items-center gap-1"
            >
              View all
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Users -->
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(stats.users.total) }}
              </div>
              <div class="text-sm text-base-content/60">Total Users</div>
            </div>

            <!-- Active Users -->
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(stats.users.active) }}
              </div>
              <div class="text-sm text-base-content/60">Active Users</div>
            </div>

            <!-- New Signups (7d) -->
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(stats.users.newLast7Days) }}
              </div>
              <div class="text-sm text-base-content/60">New (7 days)</div>
            </div>

            <!-- New Signups (30d) -->
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(stats.users.newLast30Days) }}
              </div>
              <div class="text-sm text-base-content/60">New (30 days)</div>
            </div>
          </div>
        </div>

        <!-- Revenue Section -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Revenue
            </h2>
            <NuxtLink
              to="/subscriptions"
              class="text-sm text-base-content/60 hover:text-primary transition-colors flex items-center gap-1"
            >
              View subscriptions
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- MRR -->
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatCurrency(stats.revenue.mrr) }}
              </div>
              <div class="text-sm text-base-content/60">MRR</div>
              <div v-if="stats.revenue.mrr === 0 && (stats.revenue.paidProSubscriptions + stats.revenue.manualProSubscriptions) > 0" class="text-xs text-warning/80">
                No Stripe-billed subscriptions
              </div>
            </div>

            <!-- Paid Pro -->
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(stats.revenue.paidProSubscriptions) }}
              </div>
              <div class="text-sm text-base-content/60">Paid Pro</div>
            </div>

            <!-- Manual Pro -->
            <div class="space-y-1">
              <div class="text-3xl" :class="stats.revenue.manualProSubscriptions > 0 ? 'text-base-content' : 'text-base-content/50'" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(stats.revenue.manualProSubscriptions) }}
              </div>
              <div class="text-sm text-base-content/60">Manual Pro</div>
            </div>

            <!-- Free Subscriptions -->
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(stats.revenue.freeSubscriptions) }}
              </div>
              <div class="text-sm text-base-content/60">Free</div>
            </div>
          </div>
        </div>

        <!-- Sites Section -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Sites
            </h2>
            <NuxtLink
              to="/sites"
              class="text-sm text-base-content/60 hover:text-primary transition-colors flex items-center gap-1"
            >
              View all
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Total Sites -->
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(stats.sites.total) }}
              </div>
              <div class="text-sm text-base-content/60">Total Sites</div>
            </div>

            <!-- Verified Sites -->
            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(stats.sites.verified) }}
                </span>
                <span class="text-sm text-base-content/50">verified</span>
              </div>
              <div class="text-sm text-base-content/60">Verified Sites</div>
            </div>

            <!-- Pending Verifications -->
            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl" :class="stats.sites.pendingVerifications > 0 ? 'text-base-content' : 'text-base-content/50'" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(stats.sites.pendingVerifications) }}
                </span>
                <span v-if="stats.sites.pendingVerifications > 0" class="text-sm text-base-content/50">pending</span>
              </div>
              <div class="text-sm text-base-content/60">Pending Verification</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
          <h2 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
            Quick Actions
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <NuxtLink
              to="/users"
              class="flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all"
            >
              <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70">
                <UsersIcon class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-medium text-base-content">Manage Users</div>
                <div class="text-xs text-base-content/50">View and edit user accounts</div>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/sites"
              class="flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all"
            >
              <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70">
                <GlobeAltIcon class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-medium text-base-content">Manage Sites</div>
                <div class="text-xs text-base-content/50">View and configure sites</div>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/subscriptions"
              class="flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all"
            >
              <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70">
                <CreditCardIcon class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-medium text-base-content">Subscriptions</div>
                <div class="text-xs text-base-content/50">Manage billing and plans</div>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/audit-logs"
              class="flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all"
            >
              <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70">
                <ClipboardDocumentListIcon class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-medium text-base-content">Audit Logs</div>
                <div class="text-xs text-base-content/50">Review activity history</div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  UsersIcon,
  GlobeAltIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'admin',
})

interface DashboardStats {
  users: {
    total: number
    newLast7Days: number
    newLast30Days: number
    active: number
  }
  revenue: {
    mrr: number
    paidProSubscriptions: number
    manualProSubscriptions: number
    freeSubscriptions: number
  }
  sites: {
    total: number
    verified: number
    pendingVerifications: number
  }
}

const loading = ref(true)
const error = ref<string | null>(null)
const stats = ref<DashboardStats | null>(null)

const formatNumber = (value: number): string => {
  return value.toLocaleString()
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const fetchDashboardData = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<DashboardStats>('/api/admin/dashboard/stats')
    stats.value = response
  } catch (err: any) {
    error.value = err?.message || 'An unexpected error occurred'
    console.error('Failed to fetch dashboard data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>
