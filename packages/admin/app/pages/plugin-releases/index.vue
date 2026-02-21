<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Plugin Releases</span>
        </div>
        <div>
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            Beta Plugin Upload
          </h1>
          <p class="text-base-content/60 mt-2">Upload and manage beta versions of the Create plugin</p>
        </div>
      </div>

      <!-- Current Beta Info Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
        <h2 class="text-lg font-semibold text-base-content mb-4" style="font-family: 'Instrument Serif', serif;">
          Current Beta Version
        </h2>

        <!-- Loading -->
        <div v-if="loadingInfo" class="flex items-center gap-3 py-4">
          <span class="loading loading-spinner loading-sm text-primary"></span>
          <span class="text-sm text-base-content/50">Loading beta info...</span>
        </div>

        <!-- No Beta Available -->
        <div v-else-if="!betaInfo?.exists" class="py-4">
          <div class="flex items-center gap-3 text-base-content/50">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span class="text-sm">No beta version has been uploaded yet.</span>
          </div>
        </div>

        <!-- Beta Info -->
        <div v-else class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="flex flex-col">
              <span class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Version</span>
              <span class="text-sm font-medium text-base-content">
                <span class="badge badge-sm badge-success">{{ betaInfo.version }}</span>
              </span>
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-base-content/50 uppercase tracking-wider mb-1">File Size</span>
              <span class="text-sm font-medium text-base-content">{{ formatFileSize(betaInfo.size) }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Uploaded At</span>
              <span class="text-sm font-medium text-base-content">{{ formatDate(betaInfo.uploadedAt) }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Original Filename</span>
              <span class="text-sm font-medium text-base-content truncate" :title="betaInfo.originalFilename">{{ betaInfo.originalFilename }}</span>
            </div>
          </div>

          <div class="pt-2 border-t border-base-300/50">
            <span class="text-xs text-base-content/50 uppercase tracking-wider">Download URL</span>
            <div class="flex items-center gap-2 mt-1">
              <code class="text-sm bg-base-200 px-3 py-1.5 rounded-lg font-mono flex-1 truncate">{{ downloadUrl }}</code>
              <button class="btn btn-ghost btn-sm" @click="copyDownloadUrl" :title="copied ? 'Copied!' : 'Copy URL'">
                <svg v-if="!copied" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg v-else class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300 mb-6">
        <h2 class="text-lg font-semibold text-base-content mb-4" style="font-family: 'Instrument Serif', serif;">
          Upload New Beta Version
        </h2>

        <form @submit.prevent="uploadBeta" class="space-y-4">
          <!-- Version Input -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Version <span class="text-base-content/40">(optional)</span></span>
            </label>
            <input
              v-model="version"
              type="text"
              class="input input-bordered w-full max-w-sm"
              placeholder="e.g. 2.0.0-beta.1"
            />
            <label class="label">
              <span class="label-text-alt text-base-content/40">Semantic version for tracking. Also sent as X-Beta-Version header.</span>
            </label>
          </div>

          <!-- File Drop Zone -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Plugin ZIP File <span class="text-error">*</span></span>
            </label>
            <div
              class="border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer"
              :class="[
                isDragging
                  ? 'border-primary bg-primary/5'
                  : selectedFile
                    ? 'border-success bg-success/5'
                    : 'border-base-300 hover:border-primary/50 hover:bg-base-50'
              ]"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
              @click="openFileDialog"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".zip"
                class="hidden"
                @change="handleFileSelect"
              />

              <div v-if="selectedFile" class="flex flex-col items-center gap-2">
                <svg class="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="font-medium text-base-content">{{ selectedFile.name }}</p>
                  <p class="text-sm text-base-content/50">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
                <button type="button" class="btn btn-ghost btn-xs text-error" @click.stop="clearFile">
                  Remove
                </button>
              </div>

              <div v-else class="flex flex-col items-center gap-2">
                <svg class="w-10 h-10 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div>
                  <p class="font-medium text-base-content/70">Drop a .zip file here or click to browse</p>
                  <p class="text-sm text-base-content/40">Maximum file size: 50MB</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Error -->
          <div v-if="uploadError" class="alert alert-error">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ uploadError }}</span>
          </div>

          <!-- Upload Success -->
          <div v-if="uploadSuccess" class="alert alert-success">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ uploadSuccess }}</span>
          </div>

          <!-- Submit Button -->
          <div class="flex items-center gap-4">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!selectedFile || uploading"
            >
              <span v-if="uploading" class="loading loading-spinner loading-sm"></span>
              {{ uploading ? 'Uploading...' : 'Upload Beta Plugin' }}
            </button>
          </div>
        </form>
      </div>

      <!-- GitHub Actions Info Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-base-content mb-4" style="font-family: 'Instrument Serif', serif;">
          GitHub Actions Integration
        </h2>
        <p class="text-sm text-base-content/60 mb-4">
          You can automate beta uploads from your CI/CD pipeline using the upload API endpoint directly.
        </p>

        <div class="bg-base-200 rounded-lg p-4 overflow-x-auto">
          <pre class="text-sm font-mono text-base-content/80 whitespace-pre"><code>curl -X POST {{ mainAppUrl }}/api/v2/internal/upload-beta-plugin \
  -H "X-Beta-Upload-Key: $BETA_UPLOAD_API_KEY" \
  -H "X-Beta-Version: 2.0.0-beta.1" \
  -F "file=@create-plugin.zip"</code></pre>
        </div>

        <div class="mt-4 text-sm text-base-content/50">
          <p>Set <code class="bg-base-200 px-1.5 py-0.5 rounded text-xs">NUXT_BETA_UPLOAD_API_KEY</code> in your main app environment and use the same value as <code class="bg-base-200 px-1.5 py-0.5 rounded text-xs">BETA_UPLOAD_API_KEY</code> in your GitHub Actions secrets.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

interface BetaInfo {
  exists: boolean
  filename?: string
  size?: number
  uploadedAt?: string
  version?: string
  originalFilename?: string
  downloadUrl?: string
  message?: string
}

// State
const betaInfo = ref<BetaInfo | null>(null)
const loadingInfo = ref(false)
const selectedFile = ref<File | null>(null)
const version = ref('')
const isDragging = ref(false)
const uploading = ref(false)
const uploadError = ref<string | null>(null)
const uploadSuccess = ref<string | null>(null)
const copied = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Computed
const mainAppUrl = computed(() => {
  // In production this would come from config, show placeholder for the curl example
  return window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://create.studio'
})

const downloadUrl = computed(() => {
  if (!betaInfo.value?.exists) return ''
  return `${mainAppUrl.value}/downloads/beta`
})

// Fetch current beta info
const fetchBetaInfo = async () => {
  loadingInfo.value = true
  try {
    betaInfo.value = await $fetch<BetaInfo>('/api/admin/plugin-releases/beta-info')
  } catch (err: any) {
    console.error('Failed to fetch beta info:', err)
    betaInfo.value = { exists: false }
  } finally {
    loadingInfo.value = false
  }
}

// File handling
const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    validateAndSetFile(input.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    validateAndSetFile(event.dataTransfer.files[0])
  }
}

const validateAndSetFile = (file: File) => {
  uploadError.value = null
  uploadSuccess.value = null

  if (!file.name.endsWith('.zip')) {
    uploadError.value = 'Only .zip files are accepted.'
    return
  }

  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    uploadError.value = 'File is too large. Maximum size is 50MB.'
    return
  }

  selectedFile.value = file
}

const clearFile = () => {
  selectedFile.value = null
  uploadError.value = null
  uploadSuccess.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Upload
const uploadBeta = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  uploadError.value = null
  uploadSuccess.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (version.value) {
      formData.append('version', version.value)
    }

    const result = await $fetch<{ success: boolean; message: string; version?: string; size?: number }>('/api/admin/plugin-releases/upload-beta', {
      method: 'POST',
      body: formData,
    })

    if (result.success) {
      uploadSuccess.value = result.message || 'Beta plugin uploaded successfully!'
      clearFile()
      version.value = ''
      // Refresh beta info
      await fetchBetaInfo()
    }
  } catch (err: any) {
    console.error('Upload failed:', err)
    uploadError.value = err?.data?.message || err?.message || 'Failed to upload beta plugin.'
  } finally {
    uploading.value = false
  }
}

// Copy download URL
const copyDownloadUrl = async () => {
  try {
    await navigator.clipboard.writeText(downloadUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback
    const textArea = document.createElement('textarea')
    textArea.value = downloadUrl.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

// Helpers
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Init
onMounted(() => {
  fetchBetaInfo()
})
</script>
