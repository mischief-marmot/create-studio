<template>
  <div class="dynamic-field-array">
    <!-- Items List -->
    <div v-if="items.length > 0" class="space-y-4">
      <div
        v-for="(item, index) in items"
        :key="`item-${index}`"
        :data-testid="'field-group'"
        class="field-group relative border border-base-300 rounded-lg p-4 bg-base-100"
        :class="{ 'border-error': showValidation && hasValidationErrors(item, index) }"
      >
        <!-- Drag Handle (if sortable) -->
        <div
          v-if="sortable"
          :data-testid="'drag-handle'"
          class="absolute left-2 top-2 cursor-move text-base-content/50 hover:text-base-content"
          @mousedown="startDrag(index)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6L8 4H6v2h2l2 2zm0 8l-2 2H6v-2h2l2-2zm4-8l2-2h2v2h-2l-2 2zm4 8l-2 2h-2v-2h2l2-2z"/>
          </svg>
        </div>

        <!-- Item Index (if showIndex) -->
        <div v-if="showIndex" class="text-sm font-medium text-base-content/70 mb-2">
          {{ indexLabel }} {{ index + 1 }}
        </div>

        <!-- Fields -->
        <div class="grid gap-4" :class="fieldGridClass">
          <div
            v-for="(fieldConfig, fieldName) in fieldSchema"
            :key="`${index}-${fieldName}`"
            class="form-control"
          >
            <!-- Field Label -->
            <label :for="`${fieldName}-${index}`" class="label">
              <span class="label-text">
                {{ fieldConfig.label }}
                <span v-if="fieldConfig.required" class="text-error">*</span>
              </span>
            </label>

            <!-- Text Input -->
            <input
              v-if="fieldConfig.type === 'text'"
              :id="`${fieldName}-${index}`"
              :name="fieldName"
              type="text"
              :value="item[fieldName] || ''"
              :placeholder="fieldConfig.placeholder"
              :required="fieldConfig.required"
              class="input input-bordered"
              :class="{ 'input-error': showValidation && isFieldInvalid(item, fieldName, fieldConfig) }"
              @input="updateField(index, fieldName, $event.target.value)"
            />

            <!-- Number Input -->
            <input
              v-else-if="fieldConfig.type === 'number'"
              :id="`${fieldName}-${index}`"
              :name="fieldName"
              type="number"
              :value="item[fieldName] || ''"
              :placeholder="fieldConfig.placeholder"
              :min="fieldConfig.min"
              :max="fieldConfig.max"
              :step="fieldConfig.step"
              :required="fieldConfig.required"
              class="input input-bordered"
              :class="{ 'input-error': showValidation && isFieldInvalid(item, fieldName, fieldConfig) }"
              @input="updateField(index, fieldName, parseFloat($event.target.value) || undefined)"
            />

            <!-- Textarea -->
            <textarea
              v-else-if="fieldConfig.type === 'textarea'"
              :id="`${fieldName}-${index}`"
              :name="fieldName"
              :value="item[fieldName] || ''"
              :placeholder="fieldConfig.placeholder"
              :rows="fieldConfig.rows || 3"
              :required="fieldConfig.required"
              class="textarea textarea-bordered"
              :class="{ 'textarea-error': showValidation && isFieldInvalid(item, fieldName, fieldConfig) }"
              @input="updateField(index, fieldName, $event.target.value)"
            />

            <!-- Select -->
            <select
              v-else-if="fieldConfig.type === 'select'"
              :id="`${fieldName}-${index}`"
              :name="fieldName"
              :value="item[fieldName] || ''"
              :required="fieldConfig.required"
              class="select select-bordered"
              :class="{ 'select-error': showValidation && isFieldInvalid(item, fieldName, fieldConfig) }"
              @change="updateField(index, fieldName, $event.target.value)"
            >
              <option value="">{{ fieldConfig.placeholder || 'Select...' }}</option>
              <option
                v-for="option in fieldConfig.options"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>

            <!-- Checkbox -->
            <input
              v-else-if="fieldConfig.type === 'checkbox'"
              :id="`${fieldName}-${index}`"
              :name="fieldName"
              type="checkbox"
              :checked="!!item[fieldName]"
              class="checkbox"
              @change="updateField(index, fieldName, $event.target.checked)"
            />

            <!-- Nested Array -->
            <div v-else-if="fieldConfig.type === 'array'" :data-testid="'nested-array'">
              <DynamicFieldArray
                :model-value="item[fieldName] || []"
                :field-schema="fieldConfig.schema"
                :add-button-text="fieldConfig.addButtonText || 'Add Item'"
                :show-validation="showValidation"
                @update:model-value="updateField(index, fieldName, $event)"
              />
            </div>

            <!-- Validation Error -->
            <div
              v-if="showValidation && isFieldInvalid(item, fieldName, fieldConfig)"
              :data-testid="'validation-error'"
              class="text-error text-sm mt-1"
            >
              {{ getFieldError(fieldName, fieldConfig) }}
            </div>
          </div>
        </div>

        <!-- Remove Button -->
        <button
          v-if="canRemoveItems"
          :data-testid="'remove-button'"
          type="button"
          class="btn btn-sm btn-error btn-outline absolute top-2 right-2"
          @click="removeItem(index)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8 text-base-content/60">
      <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      <p>{{ emptyStateText || 'No items added yet' }}</p>
    </div>

    <!-- Add Button -->
    <button
      v-if="canAddItems"
      :data-testid="'add-button'"
      type="button"
      class="btn btn-primary btn-outline w-full mt-4"
      @click="addItem"
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      {{ addButtonText || 'Add Item' }}
    </button>

    <!-- Items Count -->
    <div v-if="showCount && items.length > 0" class="text-sm text-base-content/60 mt-2">
      {{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}
      <span v-if="maxItems"> (max {{ maxItems }})</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FieldOption {
  value: string | number
  label: string
}

interface FieldConfig {
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'array'
  label: string
  placeholder?: string
  required?: boolean
  min?: number
  max?: number
  step?: number
  rows?: number
  options?: FieldOption[]
  schema?: Record<string, FieldConfig>
  addButtonText?: string
}

interface Props {
  modelValue: any[]
  fieldSchema: Record<string, FieldConfig>
  addButtonText?: string
  emptyStateText?: string
  showValidation?: boolean
  showIndex?: boolean
  indexLabel?: string
  showCount?: boolean
  sortable?: boolean
  minItems?: number
  maxItems?: number
  fieldGridClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  addButtonText: 'Add Item',
  emptyStateText: 'No items added yet',
  showValidation: false,
  showIndex: true,
  indexLabel: 'Item',
  showCount: true,
  sortable: false,
  minItems: 0,
  maxItems: undefined,
  fieldGridClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
})

const emit = defineEmits<{
  'update:modelValue': [value: any[]]
}>()

const items = computed(() => props.modelValue || [])

const canAddItems = computed(() => {
  if (props.maxItems === undefined) return true
  return items.value.length < props.maxItems
})

const canRemoveItems = computed(() => {
  return items.value.length > (props.minItems || 0)
})

function addItem() {
  const newItem: any = {}
  
  // Initialize with default values based on field schema
  Object.entries(props.fieldSchema).forEach(([fieldName, config]) => {
    switch (config.type) {
      case 'text':
      case 'textarea':
        newItem[fieldName] = ''
        break
      case 'number':
        newItem[fieldName] = undefined
        break
      case 'checkbox':
        newItem[fieldName] = false
        break
      case 'select':
        newItem[fieldName] = ''
        break
      case 'array':
        newItem[fieldName] = []
        break
    }
  })

  const newItems = [...props.modelValue, newItem]
  emit('update:modelValue', newItems)
}

function removeItem(index: number) {
  const newItems = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', newItems)
}

function updateField(index: number, fieldName: string, value: any) {
  const newItems = [...props.modelValue]
  newItems[index] = { ...newItems[index], [fieldName]: value }
  emit('update:modelValue', newItems)
}

function moveItem(fromIndex: number, toIndex: number) {
  const newItems = [...props.modelValue]
  const [movedItem] = newItems.splice(fromIndex, 1)
  newItems.splice(toIndex, 0, movedItem)
  emit('update:modelValue', newItems)
}

function startDrag(index: number) {
  // Implementation for drag and drop would go here
  // For now, just expose the method for testing
}

function isFieldInvalid(item: any, fieldName: string, config: FieldConfig): boolean {
  if (!config.required) return false
  const value = item[fieldName]
  return value === undefined || value === null || value === ''
}

function hasValidationErrors(item: any, index: number): boolean {
  return Object.entries(props.fieldSchema).some(([fieldName, config]) => 
    isFieldInvalid(item, fieldName, config)
  )
}

function getFieldError(fieldName: string, config: FieldConfig): string {
  return `${config.label} is required`
}

// Expose methods for testing
defineExpose({
  moveItem,
  addItem,
  removeItem,
  updateField
})
</script>

<style scoped>
.field-group {
  position: relative;
}

.field-group:hover {
  border-color: hsl(var(--p) / 0.3);
}

.drag-handle {
  touch-action: none;
}
</style>