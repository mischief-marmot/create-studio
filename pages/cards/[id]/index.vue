<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center items-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error.statusMessage || 'Failed to load card' }}</span>
        <div>
          <NuxtLink to="/dashboard" class="btn btn-sm btn-outline">
            Back to Dashboard
          </NuxtLink>
        </div>
      </div>

      <!-- Card Content -->
      <div v-else-if="data?.card">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-4">
            <NuxtLink 
              to="/dashboard" 
              class="btn btn-ghost btn-sm"
            >
              ← Back to Dashboard
            </NuxtLink>
            <div>
              <h1 class="text-3xl font-bold">{{ data.card.title }}</h1>
              <div class="flex items-center gap-2 mt-2">
                <div class="badge badge-primary">{{ data.card.type }}</div>
                <div class="badge badge-outline">{{ data.card.status }}</div>
              </div>
            </div>
          </div>
          
          <div class="flex gap-2">
            <NuxtLink 
              :to="`/cards/${data.card.id}/edit`"
              class="btn btn-outline btn-sm"
            >
              Edit
            </NuxtLink>
            <button 
              class="btn btn-secondary btn-sm"
              @click="showSaveAsTemplate = true"
            >
              Save as Template
            </button>
            <button 
              class="btn btn-error btn-sm"
              @click="handleDelete"
              :disabled="isDeleting"
            >
              <span v-if="isDeleting" class="loading loading-spinner loading-xs"></span>
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>

        <!-- Card Preview -->
        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Visual Preview -->
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h2 class="card-title">Visual Preview</h2>
              <ClientOnly>
                <div v-if="jsonLd">
                  <Suspense>
                    <template #default>
                      <PreviewStructuredDataPreview
                        :schema="jsonLd"
                        theme="default"
                        class="w-full"
                      />
                    </template>
                    <template #fallback>
                      <div class="bg-base-200 p-4 rounded">
                        <h3 class="font-semibold mb-2">{{ data?.card?.title }}</h3>
                        <p class="text-sm opacity-70 mb-4">{{ data?.card?.description }}</p>
                        <div class="text-xs">
                          <strong>Type:</strong> {{ data?.card?.type }}<br>
                          <strong>Status:</strong> {{ data?.card?.status }}
                        </div>
                      </div>
                    </template>
                  </Suspense>
                </div>
                <div v-else class="text-center text-base-content/60 py-8">
                  <p>No preview available</p>
                  <div v-if="data?.card" class="text-xs mt-2 opacity-50">
                    Debug: Card type: {{ data.card.type }}, Title: {{ data.card.title }}
                  </div>
                </div>
                
                <!-- Debug JSON-LD viewer -->
                <details v-if="jsonLd" class="mt-4">
                  <summary class="cursor-pointer text-sm opacity-70">View Generated JSON-LD</summary>
                  <pre class="bg-base-200 p-4 rounded mt-2 text-xs overflow-auto">{{ JSON.stringify(jsonLd, null, 2) }}</pre>
                </details>
                
                <!-- Debug form data -->
                <details v-if="data?.card" class="mt-2">
                  <summary class="cursor-pointer text-sm opacity-70">View Form Data</summary>
                  <pre class="bg-base-200 p-4 rounded mt-2 text-xs overflow-auto">{{ JSON.stringify(cardFormData, null, 2) }}</pre>
                </details>
              </ClientOnly>
            </div>
          </div>

          <!-- Card Details -->
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h2 class="card-title">Card Details</h2>
              
              <div class="space-y-4">
                <div v-if="data.card.description">
                  <h3 class="font-semibold">Description</h3>
                  <p class="text-sm opacity-70">{{ data.card.description }}</p>
                </div>

                <!-- Recipe-specific details -->
                <template v-if="data.card.type === 'Recipe'">
                  <div v-if="data.card.prep_time || data.card.cook_time || data.card.servings" class="grid grid-cols-3 gap-4">
                    <div v-if="data.card.prep_time" class="stat">
                      <div class="stat-title text-xs">Prep Time</div>
                      <div class="stat-value text-lg">{{ data.card.prep_time }}m</div>
                    </div>
                    <div v-if="data.card.cook_time" class="stat">
                      <div class="stat-title text-xs">Cook Time</div>
                      <div class="stat-value text-lg">{{ data.card.cook_time }}m</div>
                    </div>
                    <div v-if="data.card.servings" class="stat">
                      <div class="stat-title text-xs">Servings</div>
                      <div class="stat-value text-lg">{{ data.card.servings }}</div>
                    </div>
                  </div>
                </template>

                <div>
                  <h3 class="font-semibold">Created</h3>
                  <p class="text-sm opacity-70">{{ formatDate(data.card.created_at) }}</p>
                </div>

                <div>
                  <h3 class="font-semibold">Last Updated</h3>
                  <p class="text-sm opacity-70">{{ formatDate(data.card.updated_at) }}</p>
                </div>

                <div>
                  <h3 class="font-semibold">Slug</h3>
                  <p class="text-sm opacity-70 font-mono">{{ data.card.slug }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- JSON-LD Output -->
        <div class="mt-8">
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h2 class="card-title">Generated JSON-LD</h2>
              <div class="mockup-code">
                <pre><code>{{ JSON.stringify(jsonLd, null, 2) }}</code></pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Version History -->
        <div class="mt-8">
          <CardVersionHistory 
            :card-id="cardId" 
            @restored="handleVersionRestored"
          />
        </div>
      </div>

      <!-- Save as Template Modal -->
      <div v-if="showSaveAsTemplate" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Save as Template</h3>
          
          <form @submit.prevent="handleSaveAsTemplate">
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Template Name *</span>
              </label>
              <input 
                v-model="templateForm.name"
                type="text" 
                placeholder="e.g., Basic Pasta Recipe Template"
                class="input input-bordered" 
                required
              />
            </div>

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Description</span>
              </label>
              <textarea 
                v-model="templateForm.description"
                class="textarea textarea-bordered" 
                placeholder="Describe what this template is for..."
              ></textarea>
            </div>

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Category</span>
              </label>
              <input 
                v-model="templateForm.category"
                type="text" 
                placeholder="e.g., Pasta, Dessert, Appetizer"
                class="input input-bordered"
              />
            </div>

            <div class="form-control mb-4">
              <label class="cursor-pointer label">
                <span class="label-text">Make this template public</span> 
                <input v-model="templateForm.isPublic" type="checkbox" class="checkbox" />
              </label>
            </div>

            <div class="modal-action">
              <button 
                type="button"
                class="btn btn-ghost"
                @click="closeSaveAsTemplate"
              >
                Cancel
              </button>
              <button 
                type="submit"
                class="btn btn-primary"
                :disabled="!templateForm.name || isSavingTemplate"
              >
                <span v-if="isSavingTemplate" class="loading loading-spinner loading-sm"></span>
                {{ isSavingTemplate ? 'Saving...' : 'Save Template' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardFormData } from '~/types/schemas'
import { generateJsonLd } from '~/utils/json-ld-generator'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const { deleteCard } = useCards()
const { createTemplateFromCard } = useTemplates()
const { addToast } = useToasts()

const cardId = route.params.id as string
const isDeleting = ref(false)

// Template state
const showSaveAsTemplate = ref(false)
const isSavingTemplate = ref(false)
const templateForm = ref({
  name: '',
  description: '',
  category: '',
  isPublic: false
})

// Fetch card data
const { data, error, pending } = await useFetch(`/api/cards/${cardId}`)

// Convert card data to form format for preview
const cardFormData = computed((): CardFormData => {
  if (!data?.card) return {} as CardFormData

  const card = data.card
  return {
    type: card.type,
    title: card.title,
    description: card.description || '',
    image: card.image_url,
    ingredients: card.card_ingredients?.map((ing: any) => ({
      name: ing.ingredients?.name || '',
      amount: ing.amount?.toString() || '',
      unit: ing.unit || ''
    })) || [],
    instructions: card.instructions?.map((inst: any) => ({
      name: inst.title || '',
      text: inst.content || ''
    })) || [],
    prepTime: card.prep_time,
    cookTime: card.cook_time,
    totalTime: card.total_time,
    servings: card.servings
  }
})

// Generate JSON-LD
const jsonLd = computed(() => {
  if (!data?.card) return null
  try {
    const formData = cardFormData.value
    if (!formData.title || !formData.type) {
      console.warn('Missing required fields for JSON-LD generation:', { title: formData.title, type: formData.type })
      return null
    }
    return generateJsonLd(formData)
  } catch (error) {
    console.error('Failed to generate JSON-LD:', error)
    return null
  }
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
    return
  }

  isDeleting.value = true
  
  try {
    await deleteCard(cardId)
    addToast({
      title: 'Success',
      description: 'Card deleted successfully',
      type: 'success'
    })
    router.push('/dashboard')
  } catch (error) {
    console.error('Failed to delete card:', error)
    addToast({
      title: 'Error',
      description: 'Failed to delete card. Please try again.',
      type: 'error'
    })
  } finally {
    isDeleting.value = false
  }
}

const handleVersionRestored = () => {
  // Refresh the card data when a version is restored
  refresh()
}

const closeSaveAsTemplate = () => {
  showSaveAsTemplate.value = false
  templateForm.value = {
    name: '',
    description: '',
    category: '',
    isPublic: false
  }
}

const handleSaveAsTemplate = async () => {
  if (!templateForm.value.name || !data.value?.card) return

  isSavingTemplate.value = true
  
  try {
    await createTemplateFromCard(cardId, {
      name: templateForm.value.name,
      description: templateForm.value.description || undefined,
      category: templateForm.value.category || undefined,
      isPublic: templateForm.value.isPublic
    })
    
    addToast({
      title: 'Success',
      description: 'Template created successfully',
      type: 'success'
    })
    
    closeSaveAsTemplate()
  } catch (error) {
    console.error('Failed to create template:', error)
    addToast({
      title: 'Error',
      description: 'Failed to create template. Please try again.',
      type: 'error'
    })
  } finally {
    isSavingTemplate.value = false
  }
}

// Initialize template form with card data
watchEffect(() => {
  if (data.value?.card && showSaveAsTemplate.value && !templateForm.value.name) {
    templateForm.value.name = `${data.value.card.title} Template`
    templateForm.value.description = data.value.card.description || ''
  }
})
</script>