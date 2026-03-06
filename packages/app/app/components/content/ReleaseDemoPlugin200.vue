<template>
  <div class="not-prose">

    <!-- ===== Adjustable Servings ===== -->
    <template v-if="!feature || feature === 'servings'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-center">
          <div class="sm:p-8 flex flex-col justify-center p-6">
            <div class="text-base-content text-xl font-bold tracking-tight">Adjustable Servings</div>
            <div class="text-base-content/80 mt-2 text-sm leading-relaxed">Scale ingredient quantities up or down with one-tap multipliers. Readers choose their serving size and every amount updates instantly.</div>
          </div>
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-base-content/70 text-xs font-semibold">Serves: 4</span>
              <div class="flex gap-1">
                <button
                  v-for="m in [1, 2, 3]"
                  :key="m"
                  class="px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
                  :class="multiplier === m
                    ? 'bg-primary text-primary-content border-primary'
                    : 'bg-base-200 text-base-content/50 border-base-300 hover:border-primary'"
                  style="border-width: 1.5px"
                  @click="multiplier = m"
                >
                  {{ m }}x
                </button>
              </div>
            </div>
            <div v-for="(ing, i) in scaledIngredients" :key="i" class="flex items-center gap-2 py-1.5 text-sm border-b border-base-200 last:border-b-0">
              <span class="font-semibold text-base-content min-w-[55px] transition-all">{{ ing.amount }}</span>
              <span class="text-base-content/60">{{ ing.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Unit Conversion ===== -->
    <template v-if="!feature || feature === 'conversion'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] items-center">
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-base-content/70 text-xs font-semibold">Ingredients</span>
              <div class="flex overflow-hidden rounded-md" style="border: 1.5px solid oklch(var(--bc) / 0.15)">
                <button
                  class="px-3 py-1 text-xs font-semibold transition-all cursor-pointer"
                  :class="!isMetric ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/50'"
                  @click="isMetric = false"
                >US</button>
                <button
                  class="px-3 py-1 text-xs font-semibold transition-all cursor-pointer"
                  :class="isMetric ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/50'"
                  @click="isMetric = true"
                >Metric</button>
              </div>
            </div>
            <div v-for="(ing, i) in conversionIngredients" :key="i" class="flex items-center gap-2 py-1.5 text-sm border-b border-base-200 last:border-b-0">
              <span class="font-semibold text-base-content min-w-[65px] transition-all">{{ ing.amount }}</span>
              <span class="text-base-content/60">{{ ing.name }}</span>
            </div>
          </div>
          <div class="sm:p-8 flex flex-col justify-center p-6">
            <div class="text-base-content text-xl font-bold tracking-tight">Unit Conversion</div>
            <div class="text-base-content/80 mt-2 text-sm leading-relaxed">Toggle between US and Metric measurements with a tap. Cups become grams, tablespoons become milliliters — automatically.</div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Interactive Checklists ===== -->
    <template v-if="!feature || feature === 'checklist'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-center">
          <div class="sm:p-8 flex flex-col justify-center p-6">
            <div class="text-base-content text-xl font-bold tracking-tight">Interactive Checklists</div>
            <div class="text-base-content/80 mt-2 text-sm leading-relaxed">Readers check off ingredients and steps as they cook. Progress is saved automatically so they can pick up where they left off.</div>
          </div>
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl p-4">
            <div
              v-for="(item, i) in checklistItems"
              :key="i"
              class="flex items-center gap-2.5 py-1.5 border-b border-base-200 last:border-b-0 cursor-pointer select-none"
              @click="checkedItems[i] = !checkedItems[i]"
            >
              <div
                class="flex items-center justify-center flex-shrink-0 transition-all rounded"
                :class="checkedItems[i]
                  ? 'bg-success border-success'
                  : 'border-base-300 hover:border-base-content/30'"
                style="border-width: 1.5px; width: 18px; height: 18px;"
              >
                <svg v-if="checkedItems[i]" class="text-success-content w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span
                class="text-sm transition-all"
                :class="checkedItems[i] ? 'line-through text-base-content/30' : 'text-base-content/70'"
              >{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Built-In Recipe Importer: split card ===== -->
    <template v-if="!feature || feature === 'importer'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] items-center">
          <!-- Illustration side -->
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl overflow-hidden">
            <div class="flex items-center gap-2.5 px-5 py-3 border-b border-base-200">
              <svg class="text-secondary w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span class="text-base-content text-sm font-bold">Recipe Importer</span>
              <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-success/10 text-success">Built-in</span>
              <span class="flex-1" />
              <button
                class="btn btn-xs btn-primary"
                :disabled="importRunning"
                @click="runImport"
              >
                {{ importRunning ? 'Importing...' : 'Import' }}
              </button>
            </div>
            <div class="px-1 py-1">
              <div
                v-for="(recipe, i) in importRecipes"
                :key="i"
                class="flex items-center gap-2.5 px-4 py-2.5 text-sm border-b border-base-100 last:border-b-0"
              >
                <div v-if="importStatuses[i] === 'idle'" class="w-1.5 h-1.5 rounded-full bg-base-300 flex-shrink-0" />
                <div v-else-if="importStatuses[i] === 'importing'" class="loading loading-spinner loading-xs text-secondary" />
                <div v-else class="flex items-center justify-center flex-shrink-0 rounded-full"
                  :class="{
                    'bg-success/10': importStatuses[i] === 'success',
                    'bg-warning/10': importStatuses[i] === 'warning',
                    'bg-error/10': importStatuses[i] === 'error',
                  }"
                  style="width: 18px; height: 18px;"
                >
                  <svg v-if="importStatuses[i] === 'success'" class="w-2.5 h-2.5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <svg v-else-if="importStatuses[i] === 'warning'" class="w-2.5 h-2.5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <svg v-else-if="importStatuses[i] === 'error'" class="w-2.5 h-2.5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </div>
                <span class="text-base-content flex-1 font-medium">{{ recipe.name }}</span>
                <span
                  v-if="importStatuses[i] !== 'idle' && importStatuses[i] !== 'importing'"
                  class="text-xs font-semibold"
                  :class="{
                    'text-success': importStatuses[i] === 'success',
                    'text-warning': importStatuses[i] === 'warning',
                    'text-error': importStatuses[i] === 'error',
                  }"
                >{{ recipe.message }}</span>
              </div>
            </div>
          </div>
          <!-- Text side -->
          <div class="sm:p-8 flex flex-col justify-center p-6">
            <div class="text-base-content text-xl font-bold tracking-tight">Built-In Recipe Importer</div>
            <div class="text-base-content/80 mt-2 text-sm leading-relaxed">The recipe importer is now integrated directly into Create — no separate plugin needed.</div>
            <ul class="mt-5 space-y-3">
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Enable directly from Create Settings
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Supports WP Recipe Maker, Tasty, EasyRecipe, and 8 more
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Errors no longer block the rest of the import
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Redesigned Reviews: split card (text left, illustration right) ===== -->
    <template v-if="!feature || feature === 'review'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-center">
          <!-- Text side -->
          <div class="sm:p-8 flex flex-col justify-center p-6">
            <div class="text-base-content text-xl font-bold tracking-tight">Review Management</div>
            <div class="text-base-content/80 mt-2 text-sm leading-relaxed">Build engagement by responding directly to reader reviews. Edit typos, manage ratings, and showcase your best reviews.</div>
            <ul class="mt-5 space-y-3">
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Author replies shown on cards
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Edit reviews to fix typos
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Featured Review block for posts
              </li>
            </ul>
          </div>
          <!-- Illustration side -->
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl p-5">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-base-content text-sm font-semibold">Sarah M.</span>
                <div class="flex gap-px">
                  <svg v-for="s in 5" :key="s" class="text-warning w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L8 11.86l-3.136 1.834a.75.75 0 0 1-1.12-.814l.853-3.575-2.79-2.39a.75.75 0 0 1 .427-1.317l3.664-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <button
                class="border-base-300 bg-base-100 text-base-content/60 hover:border-secondary hover:text-secondary flex items-center gap-1 px-2 py-1 text-xs font-semibold transition-all border rounded cursor-pointer"
                @click="startReviewEdit"
              >
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>
            <p class="text-base-content/70 m-0 text-sm leading-relaxed">{{ reviewText }}<span v-if="showCursor" class="inline-block w-px h-[0.85em] bg-secondary ml-px align-text-bottom animate-pulse" /></p>
            <div class="px-4 py-3 mt-3 rounded-lg" style="background: oklch(var(--p) / 0.06)">
              <span class="text-[10px] font-bold text-primary block mb-1">AUTHOR</span>
              <p class="text-base-content/70 m-0 text-sm">Thank you Sarah! So glad you enjoyed it.</p>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  feature?: string
}>()

// === Servings ===
const multiplier = ref(2)
const BASE_INGREDIENTS = [
  { amount: 2, unit: 'cups', name: 'flour' },
  { amount: 1, unit: 'cup', name: 'sugar' },
  { amount: 3, unit: '', name: 'eggs' },
]
const scaledIngredients = computed(() =>
  BASE_INGREDIENTS.map(ing => ({
    amount: `${ing.amount * multiplier.value} ${ing.unit}`.trim(),
    name: ing.name,
  })),
)

// === Unit Conversion ===
const isMetric = ref(false)
const US = [
  { amount: '2 cups', name: 'flour' },
  { amount: '1 cup', name: 'sugar' },
  { amount: '½ cup', name: 'butter' },
]
const METRIC = [
  { amount: '240 g', name: 'flour' },
  { amount: '200 g', name: 'sugar' },
  { amount: '115 g', name: 'butter' },
]
const conversionIngredients = computed(() => isMetric.value ? METRIC : US)

// === Checklist ===
const checklistItems = ['2 cups flour', '1 cup sugar', '3 eggs', '½ cup butter']
const checkedItems = ref<boolean[]>([true, true, false, false])

// === Importer ===
type ImportStatus = 'idle' | 'importing' | 'success' | 'warning' | 'error'
const importRecipes = [
  { name: 'Chicken Parmesan', result: 'success' as const, message: 'Imported' },
  { name: 'Pasta Carbonara', result: 'warning' as const, message: 'Missing image' },
  { name: 'Beef Stroganoff', result: 'error' as const, message: 'Failed to import' },
  { name: 'Lemon Garlic Salmon', result: 'success' as const, message: 'Imported' },
]
const importStatuses = ref<ImportStatus[]>(importRecipes.map(() => 'idle'))
const importRunning = ref(false)
let importTimeouts: ReturnType<typeof setTimeout>[] = []

const runImport = () => {
  if (importRunning.value) return
  importRunning.value = true
  importStatuses.value = importRecipes.map(() => 'idle')
  importTimeouts.forEach(clearTimeout)
  importTimeouts = []

  let delay = 200
  importRecipes.forEach((recipe, index) => {
    importTimeouts.push(setTimeout(() => {
      importStatuses.value[index] = 'importing'
    }, delay))
    delay += 500 + Math.random() * 300
    importTimeouts.push(setTimeout(() => {
      importStatuses.value[index] = recipe.result
      if (index === importRecipes.length - 1) importRunning.value = false
    }, delay))
    delay += 150
  })
}

onUnmounted(() => importTimeouts.forEach(clearTimeout))

// === Review Edit ===
const REVIEW_BASE = "This recipe was amazing! My family lovd itg."
const REVIEW_DELETE = "lovd itg."
const REVIEW_REPLACE = "loved it."

const reviewText = ref(REVIEW_BASE)
const showCursor = ref(false)
const isEditing = ref(false)
let editTimeouts: ReturnType<typeof setTimeout>[] = []

const startReviewEdit = () => {
  if (isEditing.value) return
  isEditing.value = true
  showCursor.value = true
  editTimeouts.forEach(clearTimeout)
  editTimeouts = []

  const keepText = REVIEW_BASE.slice(0, REVIEW_BASE.length - REVIEW_DELETE.length)
  let step = 0

  const deleteInterval = setInterval(() => {
    step++
    if (step >= REVIEW_DELETE.length) {
      reviewText.value = keepText
      clearInterval(deleteInterval)
      let addStep = 0
      const addInterval = setInterval(() => {
        addStep++
        reviewText.value = keepText + REVIEW_REPLACE.slice(0, addStep)
        if (addStep >= REVIEW_REPLACE.length) {
          clearInterval(addInterval)
          showCursor.value = false
          const t = setTimeout(() => {
            reviewText.value = REVIEW_BASE
            isEditing.value = false
          }, 2500)
          editTimeouts.push(t)
        }
      }, 50)
    }
    else {
      reviewText.value = REVIEW_BASE.slice(0, REVIEW_BASE.length - step)
    }
  }, 80)
}

onUnmounted(() => editTimeouts.forEach(clearTimeout))
</script>
