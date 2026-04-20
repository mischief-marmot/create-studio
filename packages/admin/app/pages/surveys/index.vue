<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Surveys</span>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
              Surveys
            </h1>
            <p class="text-base-content/60 mt-2">Publisher surveys and response data</p>
          </div>
          <NuxtLink to="/surveys/new" class="btn btn-sm btn-primary gap-2">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Survey
          </NuxtLink>
        </div>
      </div>

      <!-- Surveys Table Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading surveys...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex items-center justify-center py-16">
          <div class="max-w-md text-center space-y-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
              <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Surveys</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="fetchSurveys">Try Again</button>
          </div>
        </div>

        <!-- Table -->
        <div v-else-if="surveys.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Title</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Slug</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Responses</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Created</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="survey in surveys"
                  :key="survey.id"
                  class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors"
                >
                  <td class="py-4 px-6">
                    <div class="flex flex-col">
                      <span class="font-medium text-base-content">{{ survey.title }}</span>
                      <span v-if="survey.description" class="text-xs text-base-content/50 truncate max-w-[300px]">{{ survey.description }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm font-mono text-base-content/70">{{ survey.slug }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-sm" :class="getStatusClass(survey.status)">{{ survey.status }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-ghost badge-sm font-mono">{{ survey.response_count }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content/70">{{ formatDate(survey.createdAt) }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-1">
                      <NuxtLink
                        :to="`/surveys/${survey.id}`"
                        class="btn btn-ghost btn-xs"
                      >
                        View Results
                      </NuxtLink>
                      <NuxtLink
                        :to="`/surveys/${survey.id}/edit`"
                        class="btn btn-ghost btn-xs"
                      >
                        Edit
                      </NuxtLink>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 class="text-lg text-base-content mb-1" style="font-family: 'Instrument Serif', serif;">No Surveys Yet</h3>
          <p class="text-sm text-base-content/50">Surveys will appear here once created</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
})

interface Survey {
  id: number
  slug: string
  title: string
  description: string | null
  status: string
  response_count: number
  createdAt: string
}

const surveys = ref<Survey[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    active: 'badge-success',
    draft: 'badge-warning',
    closed: 'badge-ghost',
  }
  return map[status] || 'badge-ghost'
}

function formatDate(dateString: string): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchSurveys() {
  loading.value = true
  error.value = null

  try {
    const res = await $fetch<{ data: Survey[] }>('/api/admin/surveys')
    surveys.value = res.data
  } catch (err: any) {
    console.error('Failed to fetch surveys:', err)
    error.value = err?.data?.message || 'Failed to load surveys'
  } finally {
    loading.value = false
  }
}

onMounted(fetchSurveys)
</script>
