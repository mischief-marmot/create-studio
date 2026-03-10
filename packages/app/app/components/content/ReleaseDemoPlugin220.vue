<template>
  <div class="not-prose">

    <!-- ===== Servings Adjustment ===== -->
    <template v-if="!feature || feature === 'servings-adjustment'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-center">
          <!-- Text side (left) -->
          <div class="p-6 sm:p-8 flex flex-col justify-center">
            <div class="text-xl font-bold text-base-content tracking-tight">Servings Adjustment</div>
            <div class="text-sm text-base-content/80 mt-2 leading-relaxed">Scale ingredient quantities up or down with one-tap multipliers. Readers choose their serving size and every amount updates instantly.</div>
            <div class="mt-3 text-xs text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
              <span>🎁</span> Try it — earns +1 bonus trial day
            </div>
          </div>
          <!-- Illustration side (right) -->
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

    <!-- ===== Checklists ===== -->
    <template v-if="!feature || feature === 'checklists'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] items-center">
          <!-- Illustration (left) -->
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl p-5">
            <div class="text-[11px] font-bold text-base-content/50 uppercase tracking-wider mb-3">Instructions</div>
            <div class="space-y-2">
              <div
                v-for="(step, i) in checklistSteps"
                :key="i"
                class="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                :class="step.checked ? 'bg-success/5' : 'hover:bg-base-200/50'"
                @click="step.checked = !step.checked"
              >
                <div
                  class="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  :class="step.checked ? 'bg-success border-success' : 'border-base-300'"
                >
                  <svg v-if="step.checked" class="w-3 h-3 text-success-content" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div class="text-sm transition-all" :class="step.checked ? 'text-base-content/40 line-through' : 'text-base-content/80'">
                  {{ step.text }}
                </div>
              </div>
            </div>
          </div>
          <!-- Text side (right) -->
          <div class="p-6 sm:p-8 flex flex-col justify-center">
            <div class="text-xl font-bold text-base-content tracking-tight">Interactive Checklists</div>
            <div class="text-sm text-base-content/80 mt-2 leading-relaxed">Readers check off ingredients and instructions as they go. Progress is saved, so they can pick up where they left off.</div>
            <div class="mt-3 text-xs text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
              <span>🎁</span> Try it — earns +1 bonus trial day
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Bulk List Importer ===== -->
    <template v-if="!feature || feature === 'bulk-import'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <!-- Text on top -->
        <div class="p-6 sm:p-8 pb-0 sm:pb-0">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-xl font-bold text-base-content tracking-tight">Bulk List Importer</div>
              <div class="text-sm text-base-content/80 mt-2 leading-relaxed max-w-xl">Paste a list of URLs and Create scrapes the titles, images, and descriptions automatically. Build roundup lists in seconds instead of adding links one by one.</div>
            </div>
            <div class="text-xs text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 flex-shrink-0">
              <span>🎁</span> +1 bonus day
            </div>
          </div>
        </div>
        <!-- Full-width illustration -->
        <div class="p-4 sm:p-6">
          <div class="bg-base-100 ring-1 ring-base-content/[0.25] rounded-xl overflow-hidden">
            <!-- Toolbar -->
            <div class="flex items-center gap-2.5 px-5 py-3 border-b border-base-200">
              <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span class="text-sm font-bold text-base-content">Import Links</span>
              <span class="flex-1" />
              <button
                class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer"
                :class="scrapePhase === 'done' ? 'bg-success text-success-content' : 'bg-primary text-primary-content'"
                @click="runScrape"
              >
                {{ scrapePhase === 'done' ? '\u2713 4 links imported' : scrapePhase === 'scraping' ? 'Importing...' : 'Import All' }}
              </button>
            </div>
            <!-- Two-column: URLs left, results right -->
            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-base-200">
              <!-- URLs pane -->
              <div class="p-4">
                <div class="text-[10px] font-bold text-base-content/40 uppercase tracking-wider mb-2">Paste URLs</div>
                <div class="rounded-lg border border-base-300 bg-base-100 font-mono text-xs">
                  <div class="px-3 py-2 space-y-1">
                    <div v-for="(url, i) in bulkUrls" :key="i" class="flex items-center gap-2">
                      <span class="text-[10px] text-base-content/25 w-3 text-right select-none">{{ i + 1 }}</span>
                      <span class="text-primary/70 truncate">{{ url }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Results pane -->
              <div class="p-4">
                <div class="text-[10px] font-bold text-base-content/40 uppercase tracking-wider mb-2">Scraped Results</div>
                <div class="space-y-2">
                  <div
                    v-for="(result, i) in scrapedResults"
                    :key="i"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                    :class="result.status === 'done' ? 'bg-success/5' : result.status === 'loading' ? 'bg-base-200/50' : ''"
                  >
                    <div class="w-9 h-9 rounded-md bg-base-200 flex-shrink-0 overflow-hidden">
                      <div v-if="result.status === 'done'" class="w-full h-full bg-gradient-to-br" :class="result.gradient" />
                      <div v-else class="w-full h-full bg-base-300/50" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-base-content/80 truncate">{{ result.title }}</div>
                      <div class="text-[10px] text-base-content/40 truncate">{{ result.domain }}</div>
                    </div>
                    <div v-if="result.status === 'done'">
                      <svg class="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div v-else-if="result.status === 'loading'" class="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <div v-else class="w-4 h-4 rounded-full border-2 border-base-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Review Management ===== -->
    <template v-if="!feature || feature === 'review-management'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-center">
          <div class="p-6 sm:p-8 flex flex-col justify-center">
            <div class="text-xl font-bold text-base-content tracking-tight">Review Management</div>
            <div class="text-sm text-base-content/80 mt-2 leading-relaxed">Moderate and respond to reader reviews directly from your WordPress admin. Build engagement and trust with your audience.</div>
            <ul class="mt-5 space-y-3">
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Approve, edit, or remove reviews
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Reply to readers publicly
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Filter by rating, type, and status
              </li>
            </ul>
            <div class="mt-3 text-xs text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
              <span>🎁</span> Try it — earns +1 bonus trial day
            </div>
          </div>
          <!-- Illustration -->
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl p-5">
            <div class="text-[11px] font-bold text-base-content/50 uppercase tracking-wider mb-3">Reviews</div>
            <div class="space-y-3">
              <!-- Review 1 — with response -->
              <div class="rounded-lg ring-1 ring-base-content/[0.06] overflow-hidden">
                <div class="px-3 py-2.5">
                  <div class="flex items-center gap-2 mb-1">
                    <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">S</div>
                    <span class="text-xs font-semibold text-base-content/80">Sarah M.</span>
                    <div class="flex gap-0.5 ml-auto">
                      <svg v-for="s in 5" :key="s" class="w-3 h-3 text-warning" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>
                  </div>
                  <p class="text-xs text-base-content/60 leading-relaxed">This recipe turned out amazing! My family loved it. Will definitely make again.</p>
                </div>
                <!-- Author response -->
                <div class="bg-primary/5 px-3 py-2 border-t border-base-content/[0.04]">
                  <div class="flex items-center gap-1.5 mb-1">
                    <svg class="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    <span class="text-[10px] font-bold text-primary">Author reply</span>
                  </div>
                  <p class="text-[11px] text-base-content/50 leading-relaxed">Thank you so much, Sarah! So glad your family enjoyed it!</p>
                </div>
              </div>
              <!-- Review 2 — pending -->
              <div class="rounded-lg ring-1 ring-base-content/[0.06] px-3 py-2.5">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center text-[9px] font-bold text-warning">J</div>
                  <span class="text-xs font-semibold text-base-content/80">Jake R.</span>
                  <span class="text-[9px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full ml-1">Pending</span>
                  <div class="flex gap-0.5 ml-auto">
                    <svg v-for="s in 4" :key="s" class="w-3 h-3 text-warning" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    <svg class="w-3 h-3 text-base-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  </div>
                </div>
                <p class="text-xs text-base-content/60 leading-relaxed">Pretty good! I subbed honey for sugar and it worked great.</p>
                <div class="flex gap-2 mt-2">
                  <button class="px-2 py-1 text-[10px] font-semibold bg-success/10 text-success rounded cursor-default">Approve</button>
                  <button class="px-2 py-1 text-[10px] font-semibold bg-primary/10 text-primary rounded cursor-default">Reply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Bonus Days Checklist ===== -->
    <template v-if="!feature || feature === 'bonus-days'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] items-center">
          <!-- Illustration: Checklist FAB mockup -->
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl p-5">
            <div class="rounded-xl overflow-hidden ring-1 ring-base-content/[0.08]">
              <!-- Header -->
              <div class="px-4 py-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-base-content/[0.06] flex items-center justify-between">
                <span class="text-sm font-bold text-base-content">Earn Bonus Trial Days</span>
                <span class="text-[10px] text-base-content/40">&times;</span>
              </div>
              <!-- Countdown -->
              <div class="px-4 py-2 bg-primary/5 text-center">
                <span class="text-xs font-bold text-primary">{{ 14 + bonusEarned }} days remaining in your trial</span>
              </div>
              <!-- Progress bar -->
              <div class="px-4 pt-3 pb-1">
                <div class="h-1 bg-base-200 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" :style="{ width: `${(bonusEarned / 7) * 100}%` }" />
                </div>
              </div>
              <!-- Steps -->
              <div class="px-2 py-2">
                <div
                  v-for="(step, i) in bonusSteps"
                  :key="i"
                  class="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all"
                  :class="step.done ? 'opacity-60' : 'hover:bg-base-200/50'"
                  @click="toggleBonus(i)"
                >
                  <div
                    class="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    :class="step.done ? 'bg-success border-success' : 'border-base-300'"
                  >
                    <span v-if="step.done" class="text-[8px] text-success-content font-bold">&check;</span>
                  </div>
                  <span class="text-xs flex-1 transition-all" :class="step.done ? 'line-through text-base-content/40' : 'text-base-content/70'">{{ step.label }}</span>
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    :class="step.done ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'"
                  >{{ step.done ? '\u2713 +1 day' : '+1 day' }}</span>
                </div>
              </div>
              <!-- Footer -->
              <div class="px-4 py-2 border-t border-base-content/[0.06] text-center">
                <span class="text-xs font-semibold text-base-content/50">{{ bonusEarned }}/7 bonus days earned</span>
              </div>
            </div>
          </div>
          <!-- Text side -->
          <div class="p-6 sm:p-8 flex flex-col justify-center">
            <div class="text-xl font-bold text-base-content tracking-tight">Earn Up to 7 Bonus Days</div>
            <div class="text-sm text-base-content/80 mt-2 leading-relaxed">Each Pro feature you try adds an extra day to your trial. Complete all 7 steps and you'll have 21 days total to experience Create Pro.</div>
            <ul class="mt-5 space-y-3">
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Progress tracked automatically
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Bonus days added instantly
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Floating checklist in your WordPress admin
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  feature?: string
}>()

// === Servings Adjustment ===
const multiplier = ref(2)
const BASE_INGREDIENTS = [
  { amount: 2, unit: 'cups', name: 'flour' },
  { amount: 1, unit: 'cup', name: 'sugar' },
  { amount: 3, unit: '', name: 'eggs' },
  { amount: 0.5, unit: 'cup', name: 'butter' },
  { amount: 1, unit: 'tsp', name: 'vanilla extract' },
]
const scaledIngredients = computed(() =>
  BASE_INGREDIENTS.map(ing => ({
    amount: `${ing.amount * multiplier.value} ${ing.unit}`.trim(),
    name: ing.name,
  })),
)

// === Checklists ===
const checklistSteps = reactive([
  { text: 'Preheat oven to 350\u00B0F (175\u00B0C).', checked: true },
  { text: 'Mix flour, sugar, and salt in a large bowl.', checked: true },
  { text: 'Add butter and eggs, stir until smooth.', checked: false },
  { text: 'Pour batter into a greased 9-inch pan.', checked: false },
  { text: 'Bake for 25\u201330 minutes until golden.', checked: false },
])

// === Bulk Import ===
const bulkUrls = [
  'https://cntraveler.com/eiffel-tower-guide',
  'https://timeout.com/paris/louvre-museum',
  'https://lonelyplanet.com/montmartre-walk',
  'https://afar.com/seine-river-cruises',
]

const scrapedResults = reactive([
  { title: 'The Ultimate Eiffel Tower Guide', domain: 'cntraveler.com', gradient: 'from-sky-200/40 to-indigo-200/40', status: 'done' as const },
  { title: 'Louvre Museum: What to See First', domain: 'timeout.com', gradient: 'from-amber-200/40 to-yellow-200/40', status: 'done' as const },
  { title: 'A Walking Tour of Montmartre', domain: 'lonelyplanet.com', gradient: 'from-rose-200/40 to-pink-200/40', status: 'loading' as const },
  { title: 'Best Seine River Cruises', domain: 'afar.com', gradient: 'from-cyan-200/40 to-blue-200/40', status: 'idle' as const },
])

type ScrapePhase = 'idle' | 'scraping' | 'done'
const scrapePhase = ref<ScrapePhase>('idle')

const runScrape = () => {
  if (scrapePhase.value !== 'idle') return
  scrapePhase.value = 'scraping'

  // Reset
  scrapedResults[2].status = 'loading'
  scrapedResults[3].status = 'idle'

  setTimeout(() => {
    scrapedResults[2].status = 'done'
    scrapedResults[3].status = 'loading'
  }, 800)

  setTimeout(() => {
    scrapedResults[3].status = 'done'
    scrapePhase.value = 'done'
  }, 1500)

  setTimeout(() => {
    scrapePhase.value = 'idle'
    scrapedResults[2].status = 'loading'
    scrapedResults[3].status = 'idle'
  }, 4000)
}

// === Bonus Days ===
const bonusSteps = reactive([
  { label: 'Enable servings adjustment', done: true },
  { label: 'Enable unit conversion', done: true },
  { label: 'Enable checklists', done: false },
  { label: 'Change widget toolbar layout', done: false },
  { label: 'Use bulk list importer', done: false },
  { label: 'Manage a review', done: false },
  { label: 'Try on a premium theme', done: false },
])

const bonusEarned = computed(() => bonusSteps.filter(s => s.done).length)

const toggleBonus = (index: number) => {
  bonusSteps[index].done = !bonusSteps[index].done
}
</script>
