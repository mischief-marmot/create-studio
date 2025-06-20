<template>
  <div 
    :data-testid="'preview-container'"
    class="structured-data-preview"
    :class="[`theme-${theme}`, { 'interactive': interactive }]"
  >
    <!-- Preview Tabs -->
    <div v-if="showJsonLd || showValidation" class="tabs tabs-bordered mb-4">
      <button 
        class="tab"
        :class="{ 'tab-active': activeTab === 'preview' }"
        @click="activeTab = 'preview'"
      >
        Preview
      </button>
      <button 
        v-if="showJsonLd"
        :data-testid="'json-ld-tab'"
        class="tab"
        :class="{ 'tab-active': activeTab === 'json-ld' }"
        @click="activeTab = 'json-ld'"
      >
        JSON-LD
      </button>
      <button 
        v-if="showValidation"
        :data-testid="'validation-tab'"
        class="tab"
        :class="{ 'tab-active': activeTab === 'validation' }"
        @click="activeTab = 'validation'"
      >
        Validation
      </button>
    </div>

    <!-- Validation Status -->
    <div 
      v-if="showValidation && activeTab === 'preview'"
      :data-testid="'validation-status'"
      class="alert mb-4"
      :class="[
        validationResult.isValid ? 'alert-success' : 'alert-error',
        validationResult.isValid ? 'success' : 'error'
      ]"
    >
      <svg v-if="validationResult.isValid" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      <svg v-else class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      <span>
        {{ validationResult.isValid ? 'Valid structured data' : 'Validation errors found' }}
      </span>
    </div>

    <!-- Preview Content -->
    <div v-if="activeTab === 'preview'" class="preview-content">
      <!-- Recipe Preview -->
      <div v-if="schema['@type'] === 'Recipe'" class="recipe-preview">
        <div class="recipe-header mb-6">
          <h1 
            :data-testid="'recipe-title'"
            class="recipe-title"
            @click="interactive && $emit('title-click', schema)"
          >
            {{ schema.name }}
          </h1>
          <p 
            v-if="schema.description"
            :data-testid="'recipe-description'"
            class="recipe-description"
          >
            {{ schema.description }}
          </p>
          <div v-if="schema.author" :data-testid="'recipe-author'" class="recipe-author">
            By {{ schema.author.name }}
          </div>
        </div>

        <div class="recipe-image mb-6" v-if="schema.image">
          <img 
            :src="typeof schema.image === 'string' ? schema.image : schema.image.url" 
            :alt="schema.name"
            class="w-full h-64 object-cover rounded-lg"
          />
        </div>

        <div class="recipe-meta grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div v-if="schema.prepTime" :data-testid="'recipe-prep-time'" class="meta-item">
            <div class="meta-label">Prep Time</div>
            <div class="meta-value">{{ formatDuration(schema.prepTime) }}</div>
          </div>
          <div v-if="schema.cookTime" :data-testid="'recipe-cook-time'" class="meta-item">
            <div class="meta-label">Cook Time</div>
            <div class="meta-value">{{ formatDuration(schema.cookTime) }}</div>
          </div>
          <div v-if="schema.totalTime" :data-testid="'recipe-total-time'" class="meta-item">
            <div class="meta-label">Total Time</div>
            <div class="meta-value">{{ formatDuration(schema.totalTime) }}</div>
          </div>
          <div v-if="schema.recipeYield" class="meta-item">
            <div class="meta-label">Serves</div>
            <div class="meta-value">{{ schema.recipeYield }}</div>
          </div>
        </div>

        <div class="recipe-content grid md:grid-cols-2 gap-8">
          <div v-if="schema.recipeIngredient && schema.recipeIngredient.length" class="ingredients-section">
            <h2 class="section-title">Ingredients</h2>
            <ul class="ingredients-list">
              <li 
                v-for="(ingredient, index) in schema.recipeIngredient" 
                :key="index"
                :data-testid="'ingredient-item'"
                class="ingredient-item"
                @click="interactive && $emit('ingredient-click', ingredient, index)"
              >
                {{ ingredient }}
              </li>
            </ul>
          </div>

          <div v-if="schema.recipeInstructions && schema.recipeInstructions.length" class="instructions-section">
            <h2 class="section-title">Instructions</h2>
            <ol class="instructions-list">
              <li 
                v-for="(instruction, index) in schema.recipeInstructions" 
                :key="index"
                :data-testid="'instruction-item'"
                class="instruction-item"
                @click="interactive && $emit('instruction-click', instruction, index)"
              >
                <div v-if="instruction.name" class="instruction-name">{{ instruction.name }}</div>
                <div class="instruction-text">{{ instruction.text }}</div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- HowTo Preview -->
      <div v-else-if="schema['@type'] === 'HowTo'" class="howto-preview">
        <div class="howto-header mb-6">
          <h1 :data-testid="'howto-title'" class="howto-title">{{ schema.name }}</h1>
          <p v-if="schema.description" :data-testid="'howto-description'" class="howto-description">
            {{ schema.description }}
          </p>
          <div v-if="schema.totalTime" :data-testid="'howto-total-time'" class="howto-duration">
            Duration: {{ formatDuration(schema.totalTime) }}
          </div>
        </div>

        <div class="howto-content">
          <div class="supplies-tools grid md:grid-cols-2 gap-6 mb-8">
            <div v-if="schema.supply && schema.supply.length" class="supplies-section">
              <h2 class="section-title">Supplies Needed</h2>
              <ul class="supplies-list">
                <li 
                  v-for="(supply, index) in schema.supply" 
                  :key="index"
                  :data-testid="'supply-item'"
                  class="supply-item"
                >
                  <span v-if="supply.quantity">{{ supply.quantity }}x</span>
                  {{ supply.name }}
                </li>
              </ul>
            </div>

            <div v-if="schema.tool && schema.tool.length" class="tools-section">
              <h2 class="section-title">Tools Required</h2>
              <ul class="tools-list">
                <li 
                  v-for="(tool, index) in schema.tool" 
                  :key="index"
                  :data-testid="'tool-item'"
                  class="tool-item"
                >
                  <span v-if="tool.requiredQuantity">{{ tool.requiredQuantity }}x</span>
                  {{ tool.name }}
                </li>
              </ul>
            </div>
          </div>

          <div class="steps-section">
            <h2 class="section-title">Steps</h2>
            <ol class="steps-list">
              <li 
                v-for="(step, index) in schema.step" 
                :key="index"
                class="step-item"
              >
                <div v-if="step.name" class="step-name">{{ step.name }}</div>
                <div class="step-text">{{ step.text }}</div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- FAQ Preview -->
      <div v-else-if="schema['@type'] === 'FAQPage'" class="faq-preview">
        <div v-if="schema.name" class="faq-header mb-6">
          <h1 class="faq-title">{{ schema.name }}</h1>
          <p v-if="schema.description" class="faq-description">{{ schema.description }}</p>
        </div>

        <div class="faq-content">
          <div 
            v-for="(item, index) in schema.mainEntity" 
            :key="index"
            class="faq-item mb-6"
          >
            <div :data-testid="'faq-question'" class="faq-question">
              {{ item.name }}
            </div>
            <div :data-testid="'faq-answer'" class="faq-answer">
              {{ item.acceptedAnswer.text }}
            </div>
          </div>
        </div>
      </div>

      <!-- ItemList Preview -->
      <div v-else-if="schema['@type'] === 'ItemList'" class="list-preview">
        <div class="list-header mb-6">
          <h1 :data-testid="'list-title'" class="list-title">{{ schema.name }}</h1>
          <p v-if="schema.description" class="list-description">{{ schema.description }}</p>
        </div>

        <div class="list-content">
          <div 
            v-for="(item, index) in schema.itemListElement" 
            :key="index"
            :data-testid="'list-item'"
            class="list-item"
          >
            <div class="item-position">{{ item.position }}.</div>
            <div class="item-content">
              <div v-if="item.name" class="item-name">{{ item.name }}</div>
              <div v-if="item.description" class="item-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- JSON-LD Tab -->
    <div v-else-if="activeTab === 'json-ld'" :data-testid="'json-ld-content'" class="json-ld-content">
      <pre class="bg-base-200 p-4 rounded-lg overflow-auto text-sm"><code>{{ formatJsonLd(schema) }}</code></pre>
    </div>

    <!-- Validation Tab -->
    <div v-else-if="activeTab === 'validation'" class="validation-content">
      <div v-if="validationResult.isValid" class="alert alert-success">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span>All validation checks passed!</span>
      </div>
      <div v-else>
        <div class="alert alert-error mb-4">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <span>{{ validationResult.errors.length }} validation error(s) found</span>
        </div>
        <div :data-testid="'validation-errors'" class="validation-errors">
          <div 
            v-for="(error, index) in validationResult.errors" 
            :key="index"
            class="error-item bg-error/10 border border-error/20 rounded p-3 mb-2"
          >
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StructuredDataSchema } from '~/types/schemas'
import { validateJsonLd } from '~/utils/json-ld-generator'

interface Props {
  schema: StructuredDataSchema
  theme?: 'default' | 'modern' | 'minimal' | 'elegant'
  showJsonLd?: boolean
  showValidation?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'default',
  showJsonLd: false,
  showValidation: false,
  interactive: false
})

const emit = defineEmits<{
  'title-click': [schema: StructuredDataSchema]
  'ingredient-click': [ingredient: any, index: number]
  'instruction-click': [instruction: any, index: number]
}>()

const activeTab = ref<'preview' | 'json-ld' | 'validation'>('preview')

const validationResult = computed(() => {
  return validateJsonLd(props.schema)
})

function formatDuration(duration: string): string {
  // Convert ISO 8601 duration to human readable format
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return duration

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  const parts = []
  if (hours > 0) parts.push(`${hours} hr`)
  if (minutes > 0) parts.push(`${minutes} min`)
  if (seconds > 0 && hours === 0) parts.push(`${seconds} sec`)

  return parts.join(' ') || '0 min'
}

function formatJsonLd(schema: StructuredDataSchema): string {
  return JSON.stringify(schema, null, 2)
}
</script>

<style scoped>
.structured-data-preview {
  max-width: 56rem;
  margin: 0 auto;
}

/* Theme: Default */
.theme-default {
  background-color: hsl(var(--b1));
  border: 1px solid hsl(var(--bc) / 0.2);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.theme-default .recipe-title,
.theme-default .howto-title,
.theme-default .faq-title,
.theme-default .list-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: hsl(var(--bc));
  margin-bottom: 0.5rem;
}

.theme-default .section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--bc));
  margin-bottom: 1rem;
}

/* Theme: Modern */
.theme-modern {
  background: linear-gradient(135deg, hsl(var(--p) / 0.1), hsl(var(--s) / 0.1));
  border: none;
  border-radius: 1rem;
  padding: 2rem;
}

.theme-modern .recipe-title,
.theme-modern .howto-title,
.theme-modern .faq-title,
.theme-modern .list-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: hsl(var(--p));
  margin-bottom: 0.75rem;
}

.theme-modern .section-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: hsl(var(--bc));
  margin-bottom: 1rem;
  border-left: 4px solid hsl(var(--p));
  padding-left: 1rem;
}

/* Theme: Minimal */
.theme-minimal {
  background-color: hsl(var(--b2));
  border-left: 4px solid hsl(var(--bc) / 0.3);
  padding: 1.5rem;
}

.theme-minimal .recipe-title,
.theme-minimal .howto-title,
.theme-minimal .faq-title,
.theme-minimal .list-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: hsl(var(--bc));
  margin-bottom: 0.5rem;
}

/* Theme: Elegant */
.theme-elegant {
  background: linear-gradient(135deg, hsl(var(--b1)) 0%, hsl(var(--b2)) 100%);
  border: 1px solid hsl(var(--a));
  border-radius: 0.5rem;
  padding: 2rem;
}

.theme-elegant .recipe-title,
.theme-elegant .howto-title,
.theme-elegant .faq-title,
.theme-elegant .list-title {
  font-size: 1.875rem;
  color: hsl(var(--bc));
  margin-bottom: 0.75rem;
  font-family: 'Georgia', serif;
}

/* Common Styles */
.meta-item {
  text-align: center;
  padding: 0.75rem;
  background-color: hsl(var(--b1));
  border-radius: 0.5rem;
}

.ingredient-item,
.supply-item,
.tool-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  background-color: hsl(var(--b2));
  border-radius: 0.25rem;
  border-left: 4px solid hsl(var(--p));
}

.instruction-item,
.step-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: hsl(var(--b2));
  border-radius: 0.5rem;
  border-left: 4px solid hsl(var(--s));
}

.faq-item {
  border: 1px solid hsl(var(--bc) / 0.2);
  border-radius: 0.5rem;
  overflow: hidden;
}

.faq-question {
  font-weight: 600;
  font-size: 1.125rem;
  padding: 1rem;
  background-color: hsl(var(--p));
  color: hsl(var(--pc));
}

.faq-answer {
  padding: 1rem;
  color: hsl(var(--bc));
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background-color: hsl(var(--b2));
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--bc) / 0.2);
}

.item-position {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  background-color: hsl(var(--p));
  color: hsl(var(--pc));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.interactive .recipe-title,
.interactive .ingredient-item,
.interactive .instruction-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.interactive .recipe-title:hover,
.interactive .ingredient-item:hover,
.interactive .instruction-item:hover {
  background-color: hsl(var(--b3));
}
</style>