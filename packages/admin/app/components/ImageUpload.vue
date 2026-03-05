<template>
  <div>
    <!-- Preview -->
    <div v-if="imageUrl" class="relative group">
      <img
        :src="imageUrl"
        alt="Uploaded image"
        class="rounded-lg border border-base-300/50 object-cover w-full"
        :class="size === 'sm' ? 'max-h-32' : 'max-h-48'"
      />
      <button
        type="button"
        class="absolute top-2 right-2 btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity"
        @click="$emit('removed')"
        aria-label="Remove image"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Upload zone -->
    <div
      v-else
      class="border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200"
      :class="[
        size === 'sm' ? 'p-3' : 'p-5',
        isDragging
          ? 'border-primary bg-primary/5'
          : uploading
            ? 'border-base-300 bg-base-200/30'
            : 'border-base-300 hover:border-primary/50 hover:bg-base-50',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
      @click="openFileDialog"
    >
      <div v-if="uploading" class="flex items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm text-primary"></span>
        <span class="text-sm text-base-content/50">Uploading...</span>
      </div>
      <div v-else class="flex items-center justify-center gap-2">
        <svg class="w-5 h-5 text-base-content/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <span class="text-sm text-base-content/50">{{ placeholder }}</span>
      </div>

      <div v-if="uploadError" class="mt-2 text-xs text-error">{{ uploadError }}</div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  imageUrl?: string
  placeholder?: string
  size?: 'sm' | 'md'
}>(), {
  imageUrl: '',
  placeholder: 'Drop an image here, or click to browse',
  size: 'md',
})

const emit = defineEmits<{
  uploaded: [url: string]
  removed: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadError = ref('')

const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) uploadFile(file)
  // Reset so the same file can be re-selected
  if (input) input.value = ''
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) uploadFile(file)
}

const uploadFile = async (file: File) => {
  uploadError.value = ''

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Only JPEG, PNG, GIF, and WebP images are allowed.'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Image must be under 5MB.'
    return
  }

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const result = await $fetch<{ success: boolean; url: string }>('/api/admin/releases/upload-image', {
      method: 'POST',
      body: formData,
    })

    emit('uploaded', result.url)
  }
  catch (err: any) {
    uploadError.value = err?.data?.message || 'Upload failed. Please try again.'
  }
  finally {
    uploading.value = false
  }
}
</script>
