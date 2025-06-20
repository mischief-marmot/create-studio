<template>
  <div class="image-upload">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center p-8 border-2 border-dashed border-base-300 rounded-lg">
      <div class="text-center">
        <div :data-testid="'loading-spinner'" class="loading loading-spinner loading-lg mb-4"></div>
        <p class="text-base-content/60">{{ loadingText || 'Uploading...' }}</p>
        <progress 
          v-if="progress !== undefined"
          :data-testid="'progress-bar'"
          class="progress progress-primary w-56 mt-2" 
          :value="progress" 
          max="100"
        ></progress>
      </div>
    </div>

    <!-- Image Preview -->
    <div 
      v-else-if="hasImage" 
      :data-testid="'image-preview'"
      class="relative border-2 border-base-300 rounded-lg overflow-hidden"
    >
      <!-- Single Image Preview -->
      <div v-if="!multiple" class="relative">
        <img 
          :src="imagePreviewUrl" 
          :alt="imageAlt || 'Preview'"
          class="w-full h-48 object-cover"
          @error="handleImageError"
        />
        <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <button
            :data-testid="'remove-button'"
            type="button"
            class="btn btn-sm btn-error btn-circle opacity-0 hover:opacity-100 transition-opacity"
            @click="removeImage"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
          {{ getImageInfo() }}
        </div>
      </div>

      <!-- Multiple Images Preview -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
        <div 
          v-for="(image, index) in imageList" 
          :key="index"
          class="relative aspect-square"
        >
          <img 
            :src="getImageUrl(image)" 
            :alt="`Preview ${index + 1}`"
            class="w-full h-full object-cover rounded"
          />
          <button
            type="button"
            class="absolute top-1 right-1 btn btn-xs btn-error btn-circle"
            @click="removeImageAt(index)"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Area -->
    <div 
      v-else
      :data-testid="'upload-area'"
      class="relative border-2 border-dashed rounded-lg transition-colors duration-200"
      :class="[
        isDragOver ? 'border-primary bg-primary/5' : 'border-base-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
      ]"
      @click="!disabled && $refs.fileInput?.click()"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <!-- Upload Icon -->
        <svg class="w-12 h-12 mb-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>

        <!-- Upload Text -->
        <p class="mb-2 text-base-content font-medium">
          {{ uploadText || 'Click to upload or drag and drop' }}
        </p>
        
        <!-- Supported Formats -->
        <p class="text-sm text-base-content/60 mb-2">
          {{ supportedFormats || getSupportedFormatsText() }}
        </p>
        
        <!-- Size Limit -->
        <p v-if="maxSize" class="text-xs text-base-content/50">
          Max size: {{ formatFileSize(maxSize) }}
        </p>
      </div>

      <!-- Hidden File Input -->
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled || loading"
        class="absolute inset-0 opacity-0 cursor-pointer"
        @change="handleFileInputChange"
      />
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mt-2 text-error text-sm">
      {{ errorMessage }}
    </div>

    <!-- Help Text -->
    <div v-if="helpText" class="mt-2 text-base-content/60 text-sm">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: File | File[] | string | string[] | null
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  disabled?: boolean
  loading?: boolean
  progress?: number
  uploadText?: string
  supportedFormats?: string
  loadingText?: string
  helpText?: string
  imageAlt?: string
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  multiple: false,
  maxSize: 5 * 1024 * 1024, // 5MB default
  disabled: false,
  loading: false,
  progress: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: File | File[] | string | string[] | null]
  'upload-start': [file: File]
  'upload-complete': [url: string]
  'upload-error': [error: string]
  'error': [message: string]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)
const errorMessage = ref('')

const hasImage = computed(() => {
  if (!props.modelValue) return false
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.length > 0
  }
  return !!props.modelValue
})

const imagePreviewUrl = computed(() => {
  if (!props.modelValue || props.multiple) return ''
  
  if (typeof props.modelValue === 'string') {
    return props.modelValue
  }
  
  if (props.modelValue instanceof File) {
    return URL.createObjectURL(props.modelValue)
  }
  
  return ''
})

const imageList = computed(() => {
  if (!props.multiple || !Array.isArray(props.modelValue)) return []
  return props.modelValue
})

function getImageUrl(image: File | string): string {
  if (typeof image === 'string') return image
  if (image instanceof File) return URL.createObjectURL(image)
  return ''
}

function getImageInfo(): string {
  if (!props.modelValue || typeof props.modelValue === 'string') return ''
  if (props.modelValue instanceof File) {
    return `${props.modelValue.name} (${formatFileSize(props.modelValue.size)})`
  }
  return ''
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getSupportedFormatsText(): string {
  if (!props.accept) return ''
  const formats = props.accept.split(',').map(format => format.trim().toUpperCase())
  return `Supported: ${formats.join(', ')}`
}

function validateFile(file: File): string | null {
  // Check file size
  if (props.maxSize && file.size > props.maxSize) {
    return `File size too large. Maximum size is ${formatFileSize(props.maxSize)}`
  }

  // Check file type
  if (props.accept && props.accept !== '*' && !props.accept.includes('*')) {
    const acceptedTypes = props.accept.split(',').map(type => type.trim())
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`
    }
  }

  return null
}

function handleFileSelect(files: File[]) {
  if (!files.length) return

  errorMessage.value = ''

  // Validate files
  for (const file of files) {
    const error = validateFile(file)
    if (error) {
      errorMessage.value = error
      emit('error', error)
      return
    }
  }

  // Emit upload start for the first file
  emit('upload-start', files[0])

  // Update model value
  if (props.multiple) {
    const currentFiles = Array.isArray(props.modelValue) ? props.modelValue : []
    emit('update:modelValue', [...currentFiles, ...files])
  } else {
    emit('update:modelValue', files[0])
  }
}

function handleFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  handleFileSelect(files)
  target.value = '' // Reset input
}

function handleDragEnter() {
  if (!props.disabled && !props.loading) {
    isDragOver.value = true
  }
}

function handleDragOver() {
  // Prevent default to allow drop
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  
  if (props.disabled || props.loading) return

  const files = Array.from(event.dataTransfer?.files || [])
  handleFileSelect(files)
}

function removeImage() {
  emit('update:modelValue', null)
  errorMessage.value = ''
}

function removeImageAt(index: number) {
  if (!Array.isArray(props.modelValue)) return
  
  const newFiles = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', newFiles.length ? newFiles : null)
}

function handleImageError() {
  errorMessage.value = 'Failed to load image preview'
}

function handleUploadComplete(url: string) {
  emit('upload-complete', url)
}

// Cleanup object URLs on unmount
onUnmounted(() => {
  if (props.modelValue instanceof File) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  if (Array.isArray(props.modelValue)) {
    props.modelValue.forEach(file => {
      if (file instanceof File) {
        URL.revokeObjectURL(getImageUrl(file))
      }
    })
  }
})

// Expose methods for testing
defineExpose({
  handleFileSelect,
  handleUploadComplete
})
</script>

<style scoped>
.image-upload {
  @apply w-full;
}
</style>