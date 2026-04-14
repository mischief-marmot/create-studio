<template>
  <div class="not-prose">

    <!-- ===== List Editor ===== -->
    <template v-if="!feature || feature === 'list-editor'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <!-- Text on top -->
        <div class="sm:p-8 sm:pb-0 p-6 pb-0">
          <div class="text-base-content text-xl font-bold tracking-tight">Redesigned List Editor</div>
          <div class="text-base-content/80 max-w-xl mt-2 text-sm leading-relaxed">A permanent search panel, numbered items, and smoother drag-and-drop — without losing your place.</div>
        </div>
        <!-- Full-width illustration -->
        <div class="sm:p-6 p-4">
          <div ref="panesRef" class="bg-base-100 ring-1 ring-base-content/[0.25] rounded-xl overflow-hidden relative" style="min-height: 300px">

            <!-- ====== WIDE MODE: three-pane with toggle bar ====== -->
            <template v-if="!isMobileLayout">
              <div class="divide-base-200 flex divide-x" style="min-height: 260px">
                <!-- Search pane -->
                <div v-if="isPaneVisible('search')" class="flex flex-col flex-1 min-w-0 p-3">
                  <div class="text-[10px] font-bold text-base-content/40 uppercase tracking-wider mb-2">Add Items</div>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search posts..."
                    class="w-full px-2.5 py-2 text-[11px] rounded-lg border border-base-300 bg-base-100 text-base-content placeholder:text-base-content/40 focus:outline-none focus:border-primary/50 mb-2"
                  />
                  <div class="flex flex-wrap gap-1 mb-3">
                    <button
                      v-for="filter in searchFilters"
                      :key="filter.value"
                      class="px-2.5 py-1 text-[9px] font-semibold rounded-full transition-all cursor-pointer border"
                      :class="activeFilter === filter.value
                        ? 'bg-base-200 text-base-content border-base-300'
                        : 'bg-base-100 text-base-content/60 border-base-300 hover:border-base-content/30'"
                      @click="activeFilter = filter.value"
                    >{{ filter.label }}</button>
                  </div>
                  <div class="space-y-0.5 flex-1 overflow-hidden">
                    <div
                      v-for="result in filteredSearchResults"
                      :key="result.title"
                      class="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
                      :class="result.added
                        ? 'opacity-40 cursor-default'
                        : 'cursor-pointer hover:bg-base-200/70'"
                      @click="addItem(result)"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="text-[10px] font-medium text-base-content/80 truncate">{{ result.title }}</div>
                        <div class="text-[8px] text-base-content/40">{{ result.type }}</div>
                      </div>
                      <div v-if="result.added" class="text-[8px] text-base-content/30 flex-shrink-0">Added</div>
                      <div v-else class="text-[8px] text-primary font-semibold flex-shrink-0">+ Add</div>
                    </div>
                  </div>
                </div>
                <!-- Editor pane -->
                <div v-if="isPaneVisible('editor')" class="flex flex-col min-w-0 p-3" style="flex: 1.3">
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Editor</div>
                    <span class="text-[9px] text-base-content/30">{{ listItems.length }} items</span>
                  </div>
                  <div class="space-y-1.5">
                    <div
                      v-for="(item, index) in listItems"
                      :key="item.id"
                      class="border-base-300 bg-base-100 flex items-stretch overflow-hidden transition-all border rounded-lg"
                      :class="dragOverIndex === index ? 'border-primary/40 bg-primary/5' : ''"
                      @dragover.prevent="onDragOver(index)"
                      @dragleave="onDragLeave"
                      @drop="onDrop(index)"
                    >
                      <div class="px-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-base-200 text-base-content border-r border-base-300">{{ index + 1 }}</div>
                      <div
                        class="flex items-center gap-1 px-1.5 border-r border-base-300 text-base-content/30 hover:text-base-content/50 select-none"
                        style="cursor: grab"
                        draggable="true"
                        @dragstart="onDragStart(index)"
                        @dragend="onDragEnd"
                      >
                        <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                        <svg class="w-3 h-3.5" viewBox="0 0 24 28" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="14" r="1.5" /><circle cx="15" cy="14" r="1.5" /><circle cx="9" cy="22" r="1.5" /><circle cx="15" cy="22" r="1.5" /></svg>
                        <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                      <div class="px-1.5 flex items-center flex-shrink-0">
                        <div class="border-base-300 w-4 h-4 border-2 rounded" />
                      </div>
                      <div class="flex-1 min-w-0 py-1 pr-2">
                        <div class="text-[11px] font-medium text-base-content truncate">{{ item.title }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Preview pane -->
                <div v-if="isPaneVisible('preview')" class="flex flex-col flex-1 min-w-0 p-3">
                  <div class="text-[10px] font-bold text-base-content/40 uppercase tracking-wider mb-2">Preview</div>
                  <div class="space-y-1.5">
                    <div
                      v-for="(item, index) in listItems"
                      :key="'preview-' + item.id"
                      class="rounded-lg ring-1 ring-base-content/[0.06] p-2 transition-all"
                      :class="selectedItem === item.id ? 'ring-primary/30' : ''"
                    >
                      <div class="text-[10px] font-bold text-base-content/80 leading-snug truncate">{{ index + 1 }}. {{ item.title }}</div>
                      <div class="text-[8px] text-base-content/40 mt-0.5 leading-relaxed line-clamp-2">{{ item.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Pane toggle bar -->
              <div class="flex items-center justify-center gap-1.5 py-2.5 border-t border-base-200 bg-base-100">
                <button
                  v-for="pane in paneToggles"
                  :key="pane.label"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border"
                  :class="isPaneVisible(pane.id)
                    ? 'bg-base-200 text-base-content border-base-300'
                    : 'bg-base-100 text-base-content/40 border-base-200 hover:border-base-300'"
                  @click="togglePane(pane.id)"
                >
                  <svg v-if="pane.id === 'search'" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <svg v-if="pane.id === 'editor'" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  <svg v-if="pane.id === 'preview'" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  {{ pane.label }}
                </button>
              </div>
            </template>

            <!-- ====== NARROW MODE: tabbed Editor/Preview + pull-up search ====== -->
            <template v-else>
              <!-- Tab bar -->
              <div class="border-base-200 bg-base-100 flex items-center justify-center gap-1 px-3 py-2 border-b">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border"
                  :class="mobileTab === 'editor'
                    ? 'bg-base-200 text-base-content border-base-300'
                    : 'bg-base-100 text-base-content/40 border-base-200 hover:border-base-300'"
                  @click="mobileTab = 'editor'"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Editor
                </button>
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border"
                  :class="mobileTab === 'preview'
                    ? 'bg-base-200 text-base-content border-base-300'
                    : 'bg-base-100 text-base-content/40 border-base-200 hover:border-base-300'"
                  @click="mobileTab = 'preview'"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  Preview
                </button>
              </div>
              <!-- Tab content -->
              <div style="min-height: 200px">
                <!-- Editor tab -->
                <div v-if="mobileTab === 'editor'" class="p-3">
                  <div class="space-y-1.5">
                    <div
                      v-for="(item, index) in listItems"
                      :key="'m-' + item.id"
                      class="border-base-300 bg-base-100 flex items-stretch overflow-hidden border rounded-lg"
                    >
                      <div class="px-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-base-200 text-base-content border-r border-base-300">{{ index + 1 }}</div>
                      <div class="flex items-center gap-1 px-1.5 border-r border-base-300 text-base-content/30 select-none" style="cursor: grab">
                        <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                        <svg class="w-3 h-3.5" viewBox="0 0 24 28" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="14" r="1.5" /><circle cx="15" cy="14" r="1.5" /><circle cx="9" cy="22" r="1.5" /><circle cx="15" cy="22" r="1.5" /></svg>
                        <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                      <div class="px-1.5 flex items-center flex-shrink-0">
                        <div class="border-base-300 w-4 h-4 border-2 rounded" />
                      </div>
                      <div class="flex-1 min-w-0 py-1 pr-2">
                        <div class="text-[11px] font-medium text-base-content truncate">{{ item.title }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Preview tab -->
                <div v-if="mobileTab === 'preview'" class="p-3">
                  <div class="space-y-1.5">
                    <div
                      v-for="(item, index) in listItems"
                      :key="'mp-' + item.id"
                      class="rounded-lg ring-1 ring-base-content/[0.06] p-2"
                    >
                      <div class="text-[10px] font-bold text-base-content/80 leading-snug truncate">{{ index + 1 }}. {{ item.title }}</div>
                      <div class="text-[8px] text-base-content/40 mt-0.5 leading-relaxed line-clamp-2">{{ item.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Pull-up search drawer -->
              <div class="border-base-200 border-t">
                <div
                  class="hover:bg-base-200/50 flex items-center justify-between px-3 py-2 transition-colors cursor-pointer"
                  @click="mobileSearchOpen = !mobileSearchOpen"
                >
                  <div class="flex items-center gap-1.5">
                    <svg class="text-base-content/40 w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <span class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">Add Items</span>
                  </div>
                  <span class="text-[9px] text-base-content/40">{{ mobileSearchOpen ? 'Close' : 'Open' }}</span>
                </div>
                <div v-if="mobileSearchOpen" class="px-3 pb-3">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search posts..."
                    class="w-full px-2.5 py-2 text-[11px] rounded-lg border border-base-300 bg-base-100 text-base-content placeholder:text-base-content/40 focus:outline-none focus:border-primary/50 mb-2"
                  />
                  <div class="flex flex-wrap gap-1 mb-2">
                    <button
                      v-for="filter in searchFilters"
                      :key="'m-' + filter.value"
                      class="px-2.5 py-1 text-[9px] font-semibold rounded-full transition-all cursor-pointer border"
                      :class="activeFilter === filter.value
                        ? 'bg-base-200 text-base-content border-base-300'
                        : 'bg-base-100 text-base-content/60 border-base-300 hover:border-base-content/30'"
                      @click="activeFilter = filter.value"
                    >{{ filter.label }}</button>
                  </div>
                  <div class="space-y-0.5 max-h-28 overflow-y-auto">
                    <div
                      v-for="result in filteredSearchResults"
                      :key="'m-' + result.title"
                      class="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
                      :class="result.added ? 'opacity-40 cursor-default' : 'cursor-pointer hover:bg-base-200/70'"
                      @click="addItem(result)"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="text-[10px] font-medium text-base-content/80 truncate">{{ result.title }}</div>
                        <div class="text-[8px] text-base-content/40">{{ result.type }}</div>
                      </div>
                      <div v-if="result.added" class="text-[8px] text-base-content/30 flex-shrink-0">Added</div>
                      <div v-else class="text-[8px] text-primary font-semibold flex-shrink-0">+ Add</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

          </div>
        </div>
      </div>
    </template>

    <!-- ===== Sticky Section Headers & Toolbar ===== -->
    <template v-if="!feature || feature === 'sticky-toolbar'">
      <div class="my-10 rounded-2xl bg-base-200 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-center">
          <!-- Text side (left) -->
          <div class="sm:p-8 flex flex-col justify-center p-6">
            <div class="text-base-content text-xl font-bold tracking-tight">Sticky Headers & Toolbar</div>
            <div class="text-base-content/80 mt-2 text-sm leading-relaxed">Section headers and the formatting toolbar stick to the top of the editor as you scroll. You always know which section you're in, and formatting tools are always within reach.</div>
            <ul class="mt-5 space-y-3">
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Section headers stay visible while scrolling
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Formatting bar sticks to the top, even in long content
              </li>
            </ul>
          </div>
          <!-- Illustration side (right) — mini editor mockup -->
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.25] md:m-4 md:rounded-xl overflow-hidden flex flex-col">
            <!-- Fixed top bar (not sticky — sits above the scroll area) -->
            <div class="border-base-200 bg-base-100 flex items-center flex-shrink-0 gap-2 px-4 py-2 border-b">
              <span class="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">Editor</span>
              <span class="flex-1" />
              <button
                class="flex items-center gap-1 text-[10px] text-base-content/40 hover:text-base-content/60 cursor-pointer transition-colors"
                @click="allExpanded = !allExpanded"
              >
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline v-if="allExpanded" points="4 14 10 14 10 20" /><polyline v-if="allExpanded" points="20 10 14 10 14 4" /><line v-if="allExpanded" x1="14" y1="10" x2="21" y2="3" /><line v-if="allExpanded" x1="3" y1="21" x2="10" y2="14" />
                  <polyline v-if="!allExpanded" points="15 3 21 3 21 9" /><polyline v-if="!allExpanded" points="9 21 3 21 3 15" /><line v-if="!allExpanded" x1="21" y1="3" x2="14" y2="10" /><line v-if="!allExpanded" x1="3" y1="21" x2="10" y2="14" />
                </svg>
                {{ allExpanded ? 'Collapse All' : 'Expand All' }}
              </button>
            </div>
            <!-- Scrollable area -->
            <div class="overflow-y-auto" style="max-height: 340px">
              <div v-for="section in editorSections" :key="section.name">
                <!-- Sticky block: section header + toolbar together -->
                <div class="sticky top-0 z-[5] bg-base-100">
                  <!-- Section header -->
                  <div
                    class="flex items-center gap-2 px-4 py-2 bg-base-200 border-b border-base-content/[0.06] cursor-pointer transition-colors hover:bg-base-300/50"
                    @click="section.expanded = !section.expanded"
                  >
                    <svg
                      class="text-base-content/40 w-3 h-3 transition-transform"
                      :class="section.expanded ? 'rotate-0' : '-rotate-90'"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    ><polyline points="6 9 12 15 18 9" /></svg>
                    <span class="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">{{ section.name }}</span>
                    <span class="flex-1" />
                    <span v-if="section.badge" class="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{{ section.badge }}</span>
                  </div>
                  <!-- Formatting toolbar (inside the sticky block) -->
                  <div v-if="section.hasToolbar && section.expanded" class="flex items-center gap-1 px-4 py-1.5 bg-base-100 border-b border-base-content/[0.06]">
                    <button
                      v-for="btn in toolbarButtons"
                      :key="btn.label"
                      class="text-base-content/40 hover:text-base-content/70 hover:bg-base-200 flex items-center justify-center w-6 h-6 transition-all rounded cursor-pointer"
                      :title="btn.label"
                    >
                      <span class="text-[10px] font-bold">{{ btn.icon }}</span>
                    </button>
                    <div class="w-px h-4 bg-base-content/10 mx-0.5" />
                    <button
                      v-for="btn in toolbarBlockButtons"
                      :key="btn.label"
                      class="text-base-content/40 hover:text-base-content/70 hover:bg-base-200 flex items-center justify-center w-6 h-6 transition-all rounded cursor-pointer"
                      :title="btn.label"
                    >
                      <span class="text-[10px] font-bold">{{ btn.icon }}</span>
                    </button>
                  </div>
                </div>
                <!-- Section content -->
                <div v-if="section.expanded" class="px-4 py-3">
                  <div class="space-y-4">
                    <div v-for="(line, li) in section.lines" :key="li" class="flex items-start gap-2.5">
                      <div v-if="section.numbered" class="text-[9px] text-base-content/20 font-medium w-3 text-right flex-shrink-0 leading-relaxed">{{ li + 1 }}</div>
                      <div class="flex-1">
                        <div class="text-[10px] text-base-content/50 leading-relaxed">{{ line.text }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

// === List Editor ===
const searchQuery = ref('')
const activeFilter = ref('all')
const selectedItem = ref('item-1')
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const searchFilters = [
  { label: 'All', value: 'all' },
  { label: 'Recipes', value: 'recipe' },
  { label: 'How-To', value: 'howto' },
  { label: 'Posts', value: 'post' },
]

const searchResults = reactive([
  { title: 'Classic Banana Bread', type: 'Recipe', icon: '🍞', added: true, category: 'recipe' },
  { title: 'Chicken Tikka Masala', type: 'Recipe', icon: '🍛', added: true, category: 'recipe' },
  { title: 'Overnight Oats', type: 'Recipe', icon: '🥣', added: true, category: 'recipe' },
  { title: 'Sourdough Starter Guide', type: 'How-To', icon: '📝', added: true, category: 'howto' },
  { title: 'Pasta Carbonara', type: 'Recipe', icon: '🍝', added: false, category: 'recipe' },
  { title: 'Meal Prep for Beginners', type: 'Post', icon: '📄', added: false, category: 'post' },
  { title: 'Thai Green Curry', type: 'Recipe', icon: '🍲', added: false, category: 'recipe' },
])

const filteredSearchResults = computed(() => {
  let results = [...searchResults]
  if (activeFilter.value !== 'all') {
    results = results.filter(r => r.category === activeFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    results = results.filter(r => r.title.toLowerCase().includes(q))
  }
  // Non-added items first, added items at the bottom
  results.sort((a, b) => Number(a.added) - Number(b.added))
  return results
})

const listItems = reactive([
  { id: 'item-1', title: 'Classic Banana Bread', sourceType: 'Recipe', description: 'Moist, tender banana bread with a hint of cinnamon. Uses overripe bananas for maximum sweetness.', gradient: 'bg-gradient-to-br from-amber-200/60 to-yellow-100/60' },
  { id: 'item-2', title: 'Chicken Tikka Masala', sourceType: 'Recipe', description: 'Tender chicken in a creamy, spiced tomato sauce. A weeknight favorite.', gradient: 'bg-gradient-to-br from-orange-200/60 to-red-100/60' },
  { id: 'item-3', title: 'Overnight Oats', sourceType: 'Recipe', description: 'No-cook breakfast you prep the night before. Customize with your favorite toppings.', gradient: 'bg-gradient-to-br from-sky-200/60 to-cyan-100/60' },
  { id: 'item-4', title: 'Sourdough Starter Guide', sourceType: 'How-To', description: 'Everything you need to create and maintain a sourdough starter from scratch.', gradient: 'bg-gradient-to-br from-rose-200/60 to-pink-100/60' },
])

const addItem = (result: typeof searchResults[0]) => {
  if (result.added) return
  result.added = true
  listItems.push({
    id: `item-${Date.now()}`,
    title: result.title,
    sourceType: result.type,
    description: `A delicious ${result.title.toLowerCase()} recipe worth adding to your collection.`,
    gradient: 'bg-gradient-to-br from-emerald-200/60 to-green-100/60',
  })
}

const onDragStart = (index: number) => { dragIndex.value = index }
const onDragOver = (index: number) => { dragOverIndex.value = index }
const onDragLeave = () => { dragOverIndex.value = null }
const onDragEnd = () => { dragIndex.value = null; dragOverIndex.value = null }
const onDrop = (toIndex: number) => {
  if (dragIndex.value !== null && dragIndex.value !== toIndex) {
    const item = listItems.splice(dragIndex.value, 1)[0]
    listItems.splice(toIndex, 0, item)
  }
  dragIndex.value = null
  dragOverIndex.value = null
}

// === Pane Toggles & Responsive Layout ===
const panesRef = ref<HTMLElement | null>(null)
const containerWidth = ref(800)

// Mobile layout: tabbed Editor/Preview with pull-up search drawer
const isMobileLayout = computed(() => containerWidth.value < 400)
const mobileTab = ref<'editor' | 'preview'>('editor')
const mobileSearchOpen = ref(false)

// Wide layout: three-pane with toggles
const paneToggles = reactive([
  { id: 'search', label: 'Add Items', active: true },
  { id: 'editor', label: 'Editor', active: true },
  { id: 'preview', label: 'Preview', active: true },
])

// Auto-collapse: preview hides below 550px, search hides below 450px
const isPaneVisible = (id: string) => {
  const pane = paneToggles.find(p => p.id === id)
  if (!pane?.active) return false
  if (id === 'preview' && containerWidth.value < 550) return false
  if (id === 'search' && containerWidth.value < 450) return false
  return true
}

const togglePane = (id: string) => {
  const pane = paneToggles.find(p => p.id === id)
  if (pane) pane.active = !pane.active
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!panesRef.value) return
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      containerWidth.value = entry.contentRect.width
    }
  })
  resizeObserver.observe(panesRef.value)
  containerWidth.value = panesRef.value.clientWidth
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// === Sticky Toolbar ===
const allExpanded = ref(true)

const toolbarButtons = [
  { icon: 'B', label: 'Bold', active: false },
  { icon: 'I', label: 'Italic', active: false },
  { icon: 'U', label: 'Underline', active: false },
  { icon: '🔗', label: 'Link', active: false },
]

const toolbarBlockButtons = [
  { icon: 'H', label: 'Heading' },
  { icon: '•', label: 'Bullet List' },
  { icon: '#', label: 'Numbered List' },
  { icon: '½', label: 'Special Characters' },
]

const editorSections = reactive([
  {
    name: 'Recipe Details',
    expanded: false,
    hasToolbar: false,
    numbered: false,
    badge: '',
    lines: [] as { text: string }[],
  },
  {
    name: 'Ingredients',
    expanded: true,
    hasToolbar: false,
    numbered: true,
    badge: '8 items',
    lines: [
      { text: '2 cups all-purpose flour' },
      { text: '1 cup granulated sugar' },
      { text: '3 large eggs, room temperature' },
      { text: '\u00BD cup unsalted butter, melted' },
      { text: '1 tsp vanilla extract' },
      { text: '2 tsp baking powder' },
      { text: '\u00BC tsp kosher salt' },
      { text: '\u00BE cup whole milk' },
    ],
  },
  {
    name: 'Instructions',
    expanded: true,
    hasToolbar: true,
    numbered: true,
    badge: '8 steps',
    lines: [
      { text: 'Preheat oven to 350\u00B0F (175\u00B0C). Grease and flour a 9-inch round cake pan.' },
      { text: 'In a large bowl, whisk together flour, sugar, baking powder, and salt until combined.' },
      { text: 'In a separate bowl, beat eggs with melted butter and vanilla extract until smooth.' },
      { text: 'Pour the wet ingredients into the dry ingredients. Stir gently until just combined \u2014 do not overmix.' },
      { text: 'Gradually add the milk, folding it in until the batter is smooth and pourable.' },
      { text: 'Pour batter into the prepared pan. Tap the pan on the counter to release air bubbles.' },
      { text: 'Bake for 28\u201332 minutes, until a toothpick inserted in the center comes out clean.' },
      { text: 'Let cool in the pan for 10 minutes, then turn out onto a wire rack to cool completely before frosting.' },
    ],
  },
  {
    name: 'Nutrition',
    expanded: false,
    hasToolbar: false,
    numbered: false,
    badge: '',
    lines: [] as { text: string }[],
  },
  {
    name: 'Notes',
    expanded: false,
    hasToolbar: false,
    numbered: false,
    badge: '',
    lines: [] as { text: string }[],
  },
])

watch(
  () => allExpanded.value,
  (val) => { editorSections.forEach(s => s.expanded = val) },
)
</script>
