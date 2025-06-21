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

      <!-- Edit Form -->
      <div v-else-if="data?.card">
        <div class="flex items-center gap-4 mb-8">
          <NuxtLink 
            :to="`/cards/${cardId}`" 
            class="btn btn-ghost btn-sm"
          >
            ← Back to Card
          </NuxtLink>
          <h1 class="text-3xl font-bold">Edit Card</h1>
        </div>

        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Form Section -->
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h2 class="card-title mb-4">Card Details</h2>
              
              <!-- Card Type -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Card Type *</span>
                </label>
                <select 
                  v-model="formData.type" 
                  class="select select-bordered"
                  required
                >
                  <option value="">Select a type</option>
                  <option value="Recipe">Recipe</option>
                  <option value="HowTo">How-To Guide</option>
                  <option value="FAQ">FAQ</option>
                  <option value="ItemList">Item List</option>
                </select>
              </div>

              <!-- Title -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Title *</span>
                </label>
                <input 
                  v-model="formData.title"
                  type="text" 
                  placeholder="Enter card title"
                  class="input input-bordered" 
                  required
                />
              </div>

              <!-- Description -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Description</span>
                </label>
                <textarea 
                  v-model="formData.description"
                  class="textarea textarea-bordered h-24" 
                  placeholder="Enter card description"
                ></textarea>
              </div>

              <!-- Recipe-specific fields -->
              <template v-if="formData.type === 'Recipe'">
                <div class="grid grid-cols-3 gap-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Prep Time (min)</span>
                    </label>
                    <input 
                      v-model.number="formData.prepTime"
                      type="number" 
                      class="input input-bordered" 
                      min="0"
                    />
                  </div>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Cook Time (min)</span>
                    </label>
                    <input 
                      v-model.number="formData.cookTime"
                      type="number" 
                      class="input input-bordered" 
                      min="0"
                    />
                  </div>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Servings</span>
                    </label>
                    <input 
                      v-model.number="formData.servings"
                      type="number" 
                      class="input input-bordered" 
                      min="1"
                    />
                  </div>
                </div>
              </template>

              <!-- Image Upload -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Image</span>
                </label>
                <ImageUpload
                  v-model="formData.image"
                  accept="image/*"
                  :max-size="5000000"
                  class="w-full"
                />
              </div>

              <!-- Ingredients -->
              <template v-if="formData.type === 'Recipe'">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Ingredients</span>
                  </label>
                  <DynamicFieldArray
                    v-model="formData.ingredients"
                    :fields="ingredientFields"
                    add-text="Add Ingredient"
                    :min-items="1"
                  />
                </div>
              </template>

              <!-- Instructions -->
              <template v-if="formData.type === 'Recipe' || formData.type === 'HowTo'">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Instructions</span>
                  </label>
                  <DynamicFieldArray
                    v-model="formData.instructions"
                    :fields="instructionFields"
                    add-text="Add Step"
                    :min-items="1"
                  />
                </div>
              </template>

              <!-- Action Buttons -->
              <div class="card-actions justify-end mt-6">
                <button 
                  type="button"
                  class="btn btn-ghost"
                  @click="$router.push(`/cards/${cardId}`)"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  class="btn btn-primary"
                  :disabled="!canSave || isLoading"
                  @click="saveCard"
                >
                  <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
                  {{ isLoading ? 'Updating...' : 'Update Card' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h2 class="card-title mb-4">Preview</h2>
              <StructuredDataPreview
                :data="formData"
                :theme="'default'"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardFormData } from '~/types/schemas'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const { updateCard } = useCards()
const { addToast } = useToasts()

const cardId = route.params.id as string
const isLoading = ref(false)

// Fetch card data
const { data, error, pending } = await useFetch(`/api/cards/${cardId}`)

const formData = ref<CardFormData>({
  type: '',
  title: '',
  description: '',
  image: null,
  ingredients: [{ name: '', amount: '', unit: '' }],
  instructions: [{ name: '', text: '' }],
  prepTime: undefined,
  cookTime: undefined,
  totalTime: undefined,
  servings: undefined
})

// Initialize form with card data
watchEffect(() => {
  if (data.value?.card) {
    const card = data.value.card
    formData.value = {
      type: card.type,
      title: card.title,
      description: card.description || '',
      image: card.image_url,
      ingredients: card.card_ingredients?.map((ing: any) => ({
        name: ing.name,
        amount: ing.amount || '',
        unit: ing.unit || ''
      })) || [{ name: '', amount: '', unit: '' }],
      instructions: card.instructions?.map((inst: any) => ({
        name: inst.name || '',
        text: inst.text
      })) || [{ name: '', text: '' }],
      prepTime: card.prep_time,
      cookTime: card.cook_time,
      totalTime: card.total_time,
      servings: card.servings
    }
  }
})

// Watch for changes in prep and cook time to calculate total time
watch([() => formData.value.prepTime, () => formData.value.cookTime], ([prep, cook]) => {
  const prepNum = Number(prep) || 0
  const cookNum = Number(cook) || 0
  formData.value.totalTime = prepNum + cookNum || undefined
})

const ingredientFields = [
  { 
    key: 'name', 
    label: 'Ingredient', 
    type: 'text', 
    placeholder: 'e.g., All-purpose flour',
    required: true 
  },
  { 
    key: 'amount', 
    label: 'Amount', 
    type: 'text', 
    placeholder: '2',
    class: 'w-24' 
  },
  { 
    key: 'unit', 
    label: 'Unit', 
    type: 'text', 
    placeholder: 'cups',
    class: 'w-24' 
  }
]

const instructionFields = [
  { 
    key: 'name', 
    label: 'Step Name', 
    type: 'text', 
    placeholder: 'e.g., Mix dry ingredients' 
  },
  { 
    key: 'text', 
    label: 'Instructions', 
    type: 'textarea', 
    placeholder: 'Describe the step in detail...',
    required: true 
  }
]

const canSave = computed(() => {
  return formData.value.title.trim() && formData.value.type
})

const saveCard = async () => {
  if (!canSave.value) return

  isLoading.value = true
  
  try {
    const result = await updateCard(cardId, formData.value)
    addToast({
      title: 'Success',
      description: 'Card updated successfully',
      type: 'success'
    })
    router.push(`/cards/${cardId}`)
  } catch (error) {
    console.error('Failed to update card:', error)
    addToast({
      title: 'Error',
      description: 'Failed to update card. Please try again.',
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>