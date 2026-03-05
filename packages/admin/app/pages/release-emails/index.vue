<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Release Emails</span>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
              Send Release Email
            </h1>
            <p class="text-base-content/60 mt-2">Compose and send release notes emails to subscribers</p>
          </div>
          <button class="btn btn-outline btn-sm gap-2" @click="newDraft">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Draft
          </button>
        </div>
      </div>

      <!-- Two-column layout: Form + Preview -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <!-- Left: Compose Form -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              {{ activeDraftId ? 'Edit Draft' : 'Compose Email' }}
            </h2>
            <div class="flex items-center gap-2">
              <span v-if="activeDraftId" class="badge badge-sm badge-ghost">Draft #{{ activeDraftId }}</span>
              <span v-if="saveStatus" class="text-xs text-base-content/40">{{ saveStatus }}</span>
            </div>
          </div>

          <form @submit.prevent="sendEmail" class="space-y-5">
            <!-- Product & Version -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Product <span class="text-error">*</span></span>
                </label>
                <select v-model="form.product" class="select select-bordered w-full" required>
                  <option value="create-plugin">Create Plugin</option>
                  <option value="create-studio">Create Studio</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Version <span class="text-error">*</span></span>
                </label>
                <input
                  v-model="form.version"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="e.g. 2.1.0"
                  required
                />
              </div>
            </div>

            <!-- Title -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Email Title <span class="text-error">*</span></span>
              </label>
              <input
                v-model="form.title"
                type="text"
                class="input input-bordered w-full"
                placeholder="e.g. New Recipe Card Designer & Performance Boost"
                required
              />
              <label class="label">
                <span class="label-text-alt text-base-content/40">Subject line: {{ subjectPreview }}</span>
              </label>
            </div>

            <!-- Description -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Description <span class="text-error">*</span></span>
              </label>
              <textarea
                v-model="form.description"
                class="textarea textarea-bordered w-full h-24"
                placeholder="Brief summary of this release for the email body..."
                required
              ></textarea>
            </div>

            <!-- Hero Image -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Hero Image</span>
              </label>
              <ImageUpload
                :image-url="form.heroImageUrl"
                placeholder="Drop a hero image here, or click to browse"
                @uploaded="(url: string) => form.heroImageUrl = url"
                @removed="form.heroImageUrl = ''"
              />
            </div>

            <!-- Release URL -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Release URL</span>
              </label>
              <input
                v-model="form.releaseUrl"
                type="url"
                class="input input-bordered w-full"
                :placeholder="releaseUrlPlaceholder"
              />
              <label class="label">
                <span class="label-text-alt text-base-content/40">Leave blank to auto-generate from product and version</span>
              </label>
            </div>

            <!-- Highlights -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Highlights</span>
              </label>

              <div v-if="form.highlights.length > 0" class="space-y-3 mb-4">
                <div
                  v-for="(highlight, index) in form.highlights"
                  :key="index"
                  class="bg-base-200/50 rounded-lg p-3 space-y-3"
                >
                  <div class="flex gap-3 items-start">
                    <select
                      v-model="highlight.type"
                      class="select select-bordered select-sm w-32 shrink-0"
                    >
                      <option value="feature">New</option>
                      <option value="enhancement">Improved</option>
                      <option value="fix">Fixed</option>
                      <option value="breaking">Breaking</option>
                    </select>
                    <div class="flex-1 space-y-2">
                      <input
                        v-model="highlight.title"
                        type="text"
                        class="input input-bordered input-sm w-full"
                        placeholder="Highlight title"
                      />
                      <input
                        v-model="highlight.description"
                        type="text"
                        class="input input-bordered input-sm w-full"
                        placeholder="Brief description (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm btn-square text-error shrink-0"
                      @click="removeHighlight(index)"
                      aria-label="Remove highlight"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <!-- Highlight image -->
                  <ImageUpload
                    :image-url="highlight.imageUrl"
                    placeholder="Add image for this highlight"
                    size="sm"
                    @uploaded="(url: string) => highlight.imageUrl = url"
                    @removed="highlight.imageUrl = ''"
                  />
                </div>
              </div>

              <button
                type="button"
                class="btn btn-outline btn-sm gap-2"
                @click="addHighlight"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Highlight
              </button>
            </div>

            <!-- Success Message -->
            <div v-if="successMessage" class="alert alert-success">
              <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ successMessage }}</span>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="alert alert-error">
              <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3 pt-2">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="sending || !isFormValid"
              >
                <span v-if="sending" class="loading loading-spinner loading-sm"></span>
                Send Release Email
              </button>
              <button
                type="button"
                class="btn btn-outline"
                :disabled="saving || !isFormValid"
                @click="saveDraft"
              >
                <span v-if="saving" class="loading loading-spinner loading-sm"></span>
                {{ activeDraftId ? 'Update Draft' : 'Save Draft' }}
              </button>
              <button
                type="button"
                class="btn btn-ghost"
                @click="newDraft"
                :disabled="sending"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Email Preview -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-base-300/50">
            <h2 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Preview
            </h2>
            <div class="flex items-center gap-2">
              <div class="join">
                <button
                  type="button"
                  class="join-item btn btn-xs"
                  :class="previewDevice === 'desktop' ? 'btn-active' : 'btn-ghost'"
                  @click="previewDevice = 'desktop'"
                  aria-label="Desktop preview"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="join-item btn btn-xs"
                  :class="previewDevice === 'mobile' ? 'btn-active' : 'btn-ghost'"
                  @click="previewDevice = 'mobile'"
                  aria-label="Mobile preview"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-xs gap-1"
                @click="refreshPreview"
                aria-label="Refresh preview"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          <div class="flex-1 flex items-start justify-center p-4 bg-base-200/30 min-h-[600px]">
            <div
              class="transition-all duration-300 bg-white rounded-lg shadow-md overflow-hidden"
              :style="{
                width: previewDevice === 'mobile' ? '375px' : '100%',
                maxWidth: '100%',
                height: '100%',
              }"
            >
              <iframe
                ref="previewIframe"
                :src="previewUrl"
                class="w-full h-full border-0"
                style="min-height: 580px;"
                sandbox="allow-same-origin allow-scripts"
                title="Email preview"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Release Emails Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
        <h2 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
          Release Emails
        </h2>

        <!-- Loading -->
        <div v-if="draftsLoading" class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>

        <!-- Empty -->
        <div v-else-if="drafts.length === 0" class="text-center py-8">
          <p class="text-sm text-base-content/50">No release emails yet</p>
        </div>

        <!-- Drafts list -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-base-300/50">
                <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Product</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Version</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Title</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Updated</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="draft in drafts"
                :key="draft.id"
                class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors"
                :class="{ 'bg-primary/5': draft.id === activeDraftId }"
              >
                <td class="py-3 px-4 text-sm">{{ draft.product }}</td>
                <td class="py-3 px-4 text-sm font-mono">v{{ draft.version }}</td>
                <td class="py-3 px-4 text-sm font-medium text-base-content truncate max-w-xs">{{ draft.title }}</td>
                <td class="py-3 px-4">
                  <span
                    class="badge badge-sm"
                    :class="draft.status === 'sent' ? 'badge-success' : 'badge-ghost'"
                  >
                    {{ draft.status }}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm text-base-content/50">{{ formatDate(draft.updatedAt) }}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-1">
                    <button
                      class="btn btn-ghost btn-xs"
                      :disabled="draft.status === 'sent'"
                      @click="loadDraft(draft)"
                    >
                      Edit
                    </button>
                    <button
                      class="btn btn-ghost btn-xs text-error"
                      @click="deleteDraft(draft)"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Confirm Send Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold" style="font-family: 'Instrument Serif', serif;">
          Confirm Send
        </h3>
        <p class="py-4 text-base-content/70">
          You're about to send a release email for <strong>{{ form.product }} v{{ form.version }}</strong> to all subscribers. This cannot be undone.
        </p>
        <div class="modal-action">
          <button class="btn" @click="closeConfirmModal">Cancel</button>
          <button class="btn btn-primary" :disabled="sending" @click="confirmSend">
            <span v-if="sending" class="loading loading-spinner loading-sm"></span>
            Send Now
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <!-- Confirm Delete Modal -->
    <dialog ref="deleteModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold" style="font-family: 'Instrument Serif', serif;">
          Delete Draft
        </h3>
        <p class="py-4 text-base-content/70">
          Are you sure you want to delete the draft for <strong>{{ deletingDraft?.product }} v{{ deletingDraft?.version }}</strong>?
        </p>
        <div class="modal-action">
          <button class="btn" @click="closeDeleteModal">Cancel</button>
          <button class="btn btn-error" :disabled="deleting" @click="confirmDeleteDraft">
            <span v-if="deleting" class="loading loading-spinner loading-sm"></span>
            Delete
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
})

interface Highlight {
  title: string
  description: string
  type: 'feature' | 'enhancement' | 'fix' | 'breaking'
  imageUrl: string
}

interface Draft {
  id: number
  product: string
  version: string
  title: string
  description: string
  heroImageUrl: string | null
  releaseUrl: string | null
  highlights: Highlight[]
  status: string
  sentAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

const config = useRuntimeConfig()

const confirmModal = ref<HTMLDialogElement | null>(null)
const deleteModal = ref<HTMLDialogElement | null>(null)
const previewIframe = ref<HTMLIFrameElement | null>(null)
const sending = ref(false)
const saving = ref(false)
const deleting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const saveStatus = ref('')
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

// Draft management
const activeDraftId = ref<number | null>(null)
const drafts = ref<Draft[]>([])
const draftsLoading = ref(false)
const deletingDraft = ref<Draft | null>(null)

const defaultForm = () => ({
  product: 'create-plugin',
  version: '',
  title: '',
  description: '',
  heroImageUrl: '',
  releaseUrl: '',
  highlights: [] as Highlight[],
})

const form = ref(defaultForm())

const isFormValid = computed(() => {
  return form.value.product && form.value.version && form.value.title && form.value.description
})

const subjectPreview = computed(() => {
  if (!form.value.product || !form.value.version || !form.value.title) return '...'
  return `${form.value.product} v${form.value.version} — ${form.value.title}`
})

const releaseUrlPlaceholder = computed(() => {
  const version = form.value.version || '0.0.0'
  return `https://create.studio/releases/${form.value.product}-${version.replace(/\./g, '-')}`
})

// Preview
const mainAppUrl = computed(() => config.public.mainAppUrl || 'http://localhost:3000')

const previewProps = computed(() => ({
  title: form.value.title || 'New Release',
  version: form.value.version || '1.0.0',
  product: form.value.product || 'Create Plugin',
  description: form.value.description || 'Check out what\'s new in this release.',
  heroImageUrl: form.value.heroImageUrl || undefined,
  highlights: form.value.highlights.filter(h => h.title.trim()).map(h => ({
    ...h,
    imageUrl: h.imageUrl || undefined,
  })),
  releaseUrl: form.value.releaseUrl || releaseUrlPlaceholder.value,
  unsubscribeUrl: '#',
  productName: 'Create Studio',
  productUrl: 'https://create.studio',
  companyName: 'Mischief Marmot LLC',
}))

const previewUrl = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const buildPreviewUrl = () => {
  const params = new URLSearchParams({
    props: JSON.stringify(previewProps.value),
  })
  return `${mainAppUrl.value}/api/preview/email/ReleaseNotesEmail?${params.toString()}`
}

const updatePreview = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    previewUrl.value = buildPreviewUrl()
  }, 500)
}

previewUrl.value = buildPreviewUrl()
watch(form, updatePreview, { deep: true })

const refreshPreview = () => {
  previewUrl.value = ''
  nextTick(() => { previewUrl.value = buildPreviewUrl() })
}

// Highlights
const addHighlight = () => {
  form.value.highlights.push({ title: '', description: '', type: 'feature', imageUrl: '' })
}

const removeHighlight = (index: number) => {
  form.value.highlights.splice(index, 1)
}

// Drafts CRUD
const fetchDrafts = async () => {
  draftsLoading.value = true
  try {
    const res = await $fetch<{ data: Draft[] }>('/api/admin/releases/drafts')
    drafts.value = res.data
  }
  catch (err: any) {
    console.error('Failed to load drafts:', err)
  }
  finally {
    draftsLoading.value = false
  }
}

const saveDraft = async () => {
  saving.value = true
  saveStatus.value = ''
  errorMessage.value = ''

  try {
    const payload = {
      product: form.value.product,
      version: form.value.version,
      title: form.value.title,
      description: form.value.description,
      heroImageUrl: form.value.heroImageUrl || undefined,
      releaseUrl: form.value.releaseUrl || undefined,
      highlights: form.value.highlights.filter(h => h.title.trim()),
    }

    if (activeDraftId.value) {
      await $fetch(`/api/admin/releases/drafts/${activeDraftId.value}`, {
        method: 'PUT',
        body: payload,
      })
      saveStatus.value = 'Draft updated'
    }
    else {
      const res = await $fetch<{ draft: Draft }>('/api/admin/releases/drafts', {
        method: 'POST',
        body: payload,
      })
      activeDraftId.value = res.draft.id
      saveStatus.value = 'Draft saved'
    }

    await fetchDrafts()
    setTimeout(() => { saveStatus.value = '' }, 3000)
  }
  catch (err: any) {
    errorMessage.value = err?.data?.message || 'Failed to save draft'
  }
  finally {
    saving.value = false
  }
}

const loadDraft = (draft: Draft) => {
  activeDraftId.value = draft.id
  form.value = {
    product: draft.product,
    version: draft.version,
    title: draft.title,
    description: draft.description,
    heroImageUrl: draft.heroImageUrl || '',
    releaseUrl: draft.releaseUrl || '',
    highlights: (draft.highlights || []).map(h => ({
      title: h.title,
      description: h.description,
      type: h.type,
      imageUrl: h.imageUrl || '',
    })),
  }
  successMessage.value = ''
  errorMessage.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteDraft = (draft: Draft) => {
  deletingDraft.value = draft
  deleteModal.value?.showModal()
}

const closeDeleteModal = () => {
  deleteModal.value?.close()
}

const confirmDeleteDraft = async () => {
  if (!deletingDraft.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/releases/drafts/${deletingDraft.value.id}`, { method: 'DELETE' })
    if (activeDraftId.value === deletingDraft.value.id) {
      newDraft()
    }
    await fetchDrafts()
    closeDeleteModal()
  }
  catch (err: any) {
    console.error('Failed to delete draft:', err)
  }
  finally {
    deleting.value = false
  }
}

const newDraft = () => {
  activeDraftId.value = null
  form.value = defaultForm()
  successMessage.value = ''
  errorMessage.value = ''
  saveStatus.value = ''
}

// Send
const sendEmail = () => {
  successMessage.value = ''
  errorMessage.value = ''
  confirmModal.value?.showModal()
}

const closeConfirmModal = () => {
  confirmModal.value?.close()
}

const confirmSend = async () => {
  sending.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const payload = {
      product: form.value.product,
      version: form.value.version,
      title: form.value.title,
      description: form.value.description,
      heroImageUrl: form.value.heroImageUrl || undefined,
      releaseUrl: form.value.releaseUrl || undefined,
      highlights: form.value.highlights.filter(h => h.title.trim()).map(h => ({
        title: h.title,
        description: h.description,
        type: h.type,
        imageUrl: h.imageUrl || undefined,
      })),
      draftId: activeDraftId.value || undefined,
    }

    const result = await $fetch<{ success: boolean; message: string }>('/api/admin/releases/send-email', {
      method: 'POST',
      body: payload,
    })

    successMessage.value = result.message
    await fetchDrafts()
  }
  catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Failed to send release email'
  }
  finally {
    sending.value = false
    closeConfirmModal()
  }
}

// Helpers
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchDrafts()
})
</script>
