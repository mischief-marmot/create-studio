<template>
  <div class="p-8">
    <div class="admin-page-header mb-8">
      <h1 class="admin-page-title">Dashboard</h1>
      <p class="admin-page-subtitle">Overview of your platform metrics</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="skeleton h-32 w-full"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="font-bold">Failed to load dashboard data</h3>
        <div class="text-xs">{{ error }}</div>
      </div>
      <button class="btn btn-sm btn-ghost" @click="fetchDashboardData">
        Retry
      </button>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- User Metrics -->
      <AdminStatCard
        title="Total Users"
        :value="stats.users.total"
        :icon="UsersIcon"
      />

      <AdminStatCard
        title="New Signups (7d)"
        :value="stats.users.newLast7Days"
        :icon="UserPlusIcon"
      />

      <AdminStatCard
        title="New Signups (30d)"
        :value="stats.users.newLast30Days"
        :icon="UserPlusIcon"
      />

      <AdminStatCard
        title="Active Users"
        :value="stats.users.active"
        :icon="UsersIcon"
      />

      <!-- Revenue Metrics -->
      <AdminStatCard
        title="MRR"
        :value="stats.revenue.mrr"
        :format-value="formatCurrency"
        :icon="CurrencyDollarIcon"
      />

      <AdminStatCard
        title="Pro Subscriptions"
        :value="stats.revenue.proSubscriptions"
        :icon="CheckBadgeIcon"
      />

      <AdminStatCard
        title="Free Subscriptions"
        :value="stats.revenue.freeSubscriptions"
        :icon="UsersIcon"
      />

      <AdminStatCard
        title="Churn Rate"
        :value="formatPercentage(stats.revenue.churnRate)"
        :icon="ChartBarIcon"
      />

      <!-- Site Metrics -->
      <AdminStatCard
        title="Total Sites"
        :value="stats.sites.total"
        :icon="GlobeAltIcon"
      />

      <AdminStatCard
        title="Verified Sites"
        :value="stats.sites.verified"
        :icon="CheckCircleIcon"
      />

      <AdminStatCard
        title="Pending Verifications"
        :value="stats.sites.pendingVerifications"
        :icon="ClockIcon"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  UsersIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
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
    proSubscriptions: number
    freeSubscriptions: number
    churnRate: number
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

const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
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
