<template>
  <div class="not-prose my-12">
    <div class="text-center mb-6">
      <h3 class="text-xl font-semibold text-base-content">Try Interactive Mode</h3>
      <p class="text-sm text-base-content/60 mt-1">Click through to experience it yourself.</p>
    </div>

    <ReleasePhoneMockup>
      <div class="p-4 text-sm">
        <!-- Card header -->
        <div class="text-center mb-4">
          <div class="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Recipe</div>
          <h4 class="text-lg font-bold text-base-content leading-tight">Classic Chocolate Chip Cookies</h4>
          <div class="flex items-center justify-center gap-2 mt-2">
            <div class="flex">
              <template v-for="star in 5" :key="star">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  class="size-3.5"
                  :class="star <= userRating ? 'text-warning' : 'text-base-300'"
                  @click="userRating = star"
                  style="cursor: pointer"
                >
                  <path fill-rule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L8 11.86l-3.136 1.834a.75.75 0 0 1-1.12-.814l.853-3.575-2.79-2.39a.75.75 0 0 1 .427-1.317l3.664-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z" clip-rule="evenodd" />
                </svg>
              </template>
            </div>
            <span class="text-xs text-base-content/50">{{ userRating > 0 ? `${userRating}/5` : 'Rate this!' }}</span>
          </div>
        </div>

        <!-- Servings adjuster -->
        <div class="bg-base-200 rounded-lg px-3 py-2 flex items-center justify-between mb-4">
          <span class="text-xs text-base-content/60">Servings</span>
          <div class="flex items-center gap-2">
            <button class="btn btn-xs btn-circle btn-ghost" @click="servings = Math.max(1, servings - 6)">-</button>
            <span class="font-mono font-bold text-base-content w-6 text-center">{{ servings }}</span>
            <button class="btn btn-xs btn-circle btn-ghost" @click="servings += 6">+</button>
          </div>
        </div>

        <!-- Ingredients checklist -->
        <div class="mb-4">
          <div class="text-xs uppercase tracking-wider text-base-content/40 font-semibold mb-2">Ingredients</div>
          <label
            v-for="(ingredient, i) in scaledIngredients"
            :key="i"
            class="flex items-start gap-2 py-1.5 cursor-pointer group"
          >
            <input
              v-model="checkedIngredients[i]"
              type="checkbox"
              class="checkbox checkbox-xs checkbox-primary mt-0.5"
            />
            <span
              class="text-xs leading-relaxed transition-all"
              :class="checkedIngredients[i] ? 'line-through text-base-content/30' : 'text-base-content/80'"
            >
              {{ ingredient }}
            </span>
          </label>
        </div>

        <!-- Timer -->
        <div class="bg-primary/10 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <div class="text-xs text-primary font-semibold">Bake Timer</div>
            <div class="font-mono text-lg font-bold text-base-content">{{ formattedTimer }}</div>
          </div>
          <button
            class="btn btn-xs btn-primary"
            @click="toggleTimer"
          >
            {{ timerRunning ? 'Pause' : timerSeconds > 0 && timerSeconds < 720 ? 'Resume' : 'Start' }}
          </button>
        </div>
      </div>
    </ReleasePhoneMockup>
  </div>
</template>

<script setup lang="ts">
import ReleasePhoneMockup from './ReleasePhoneMockup.vue'

const userRating = ref(0)
const servings = ref(24)
const baseServings = 24

const baseIngredients = [
  '2¼ cups all-purpose flour',
  '1 tsp baking soda',
  '1 tsp salt',
  '1 cup butter, softened',
  '¾ cup sugar',
  '¾ cup brown sugar',
  '2 large eggs',
  '2 tsp vanilla extract',
  '2 cups chocolate chips',
]

const checkedIngredients = ref<boolean[]>(new Array(baseIngredients.length).fill(false))

const scaledIngredients = computed(() => {
  const scale = servings.value / baseServings
  if (scale === 1) return baseIngredients
  return baseIngredients.map((ingredient) => {
    return ingredient.replace(/[\d¼½¾⅓⅔]+(?:\/\d+)?/g, (match) => {
      const fractionMap: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 0.33, '⅔': 0.67 }
      const num = fractionMap[match] || parseFloat(match)
      if (isNaN(num)) return match
      const scaled = num * scale
      return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1)
    })
  })
})

// Timer
const timerSeconds = ref(720) // 12 minutes
const timerRunning = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

const formattedTimer = computed(() => {
  const mins = Math.floor(timerSeconds.value / 60)
  const secs = timerSeconds.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const toggleTimer = () => {
  if (timerRunning.value) {
    if (timerInterval) clearInterval(timerInterval)
    timerRunning.value = false
  } else {
    if (timerSeconds.value <= 0) timerSeconds.value = 720
    timerRunning.value = true
    timerInterval = setInterval(() => {
      if (timerSeconds.value > 0) {
        timerSeconds.value--
      } else {
        if (timerInterval) clearInterval(timerInterval)
        timerRunning.value = false
      }
    }, 1000)
  }
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
