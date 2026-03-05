<template>
  <div class="not-prose">

    <!-- ===== Video Type Selector ===== -->
    <template v-if="!feature || feature === 'video-type'">
      <div class="my-10 rounded-2xl bg-base-200/50 ring-1 ring-base-content/[0.04] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] items-center">
          <!-- Text side -->
          <div class="p-6 sm:p-8 flex flex-col justify-center">
            <div class="text-xl font-bold text-base-content tracking-tight">Video Shortcode Support</div>
            <div class="text-sm text-base-content/60 mt-2 leading-relaxed">Embed videos from any source directly into your cards. YouTube, Mediavine, or any shortcode — just pick and paste.</div>
            <ul class="mt-5 space-y-3">
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                YouTube, Mediavine, or any shortcode
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Works with any video plugin shortcode
              </li>
              <li class="flex items-start gap-2.5 text-sm text-base-content/70">
                <svg class="w-4 h-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Per-card video placement controls
              </li>
            </ul>
          </div>
          <!-- Illustration side -->
          <div class="bg-base-100 md:ring-1 md:ring-base-content/[0.05] md:m-4 md:rounded-xl p-5">
            <!-- Collapsible section header -->
            <div class="flex items-center gap-1.5 mb-4">
              <svg class="w-3 h-3 text-base-content/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              <span class="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">Video</span>
            </div>

            <!-- Dashed empty state area -->
            <div class="border-2 border-dashed border-base-300/60 rounded-xl px-6 py-6 flex flex-col items-center text-center">
              <!-- Video icon -->
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="16" height="16" rx="2" /><polygon points="22 8 18 12 22 16 22 8" />
                </svg>
              </div>

              <div class="text-sm font-semibold text-base-content mb-1">Add a video</div>
              <div class="text-xs text-base-content/45 leading-relaxed mb-4 max-w-[220px]">Select a Mediavine video, paste a YouTube URL, or use a shortcode from another video provider.</div>

              <!-- Video type buttons -->
              <div class="flex gap-2">
                <button
                  v-for="vtype in videoTypes"
                  :key="vtype.id"
                  class="flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border"
                  :class="selectedType === vtype.id
                    ? 'bg-neutral text-neutral-content border-neutral'
                    : 'bg-base-100 text-base-content/60 border-base-300 hover:border-base-content/30'"
                  @click="selectType(vtype.id)"
                >
                  <!-- Mediavine icon -->
                  <svg v-if="vtype.id === 'mediavine'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  <!-- YouTube icon -->
                  <svg v-if="vtype.id === 'youtube'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="4" width="16" height="16" rx="2" /><polygon points="22 8 18 12 22 16 22 8" />
                  </svg>
                  <!-- Shortcode icon -->
                  <svg v-if="vtype.id === 'shortcode'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                  </svg>
                  {{ vtype.label }}
                </button>
              </div>
            </div>

            <!-- Shortcode input row -->
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div v-if="selectedType === 'shortcode'" class="mt-3 flex gap-2">
                <div class="relative flex-1">
                  <input
                    type="text"
                    class="w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all"
                    :class="shortcodePhase === 'done'
                      ? 'bg-success/5 border-success/30 text-base-content'
                      : 'bg-base-100 border-base-300 text-base-content/70'"
                    :value="shortcodeText"
                    :placeholder="'Paste video shortcode, e.g. [shortcode id=&quot;123&quot;]'"
                    readonly
                  />
                  <span
                    v-if="shortcodePhase === 'typing'"
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-px h-3.5 bg-secondary animate-pulse"
                  />
                </div>
                <button
                  class="px-4 py-2 text-xs font-semibold rounded-lg transition-all"
                  :class="shortcodePhase === 'done'
                    ? 'bg-secondary text-secondary-content'
                    : 'bg-neutral text-neutral-content'"
                >
                  Save
                </button>
              </div>
            </Transition>

            <!-- Compact video preview -->
            <Transition
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
            >
              <div v-if="shortcodePhase === 'done'" class="mt-3 rounded-lg overflow-hidden bg-base-200/40 ring-1 ring-base-content/[0.05]">
                <div class="aspect-[21/9] bg-neutral/90 flex items-center justify-center relative">
                  <div class="w-8 h-8 rounded-full bg-secondary/90 flex items-center justify-center shadow-md">
                    <svg class="w-3.5 h-3.5 text-secondary-content ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/20">
                    <div class="flex items-center gap-1.5">
                      <div class="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div class="h-full w-1/3 bg-secondary rounded-full" />
                      </div>
                      <span class="text-[9px] text-white/50 font-mono">1:24</span>
                    </div>
                  </div>
                </div>
                <div class="px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg class="w-3 h-3 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span class="text-[11px] text-base-content/50 font-medium">Video shortcode detected</span>
                </div>
              </div>
            </Transition>
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

// === Video Type Selector ===
type VideoType = 'youtube' | 'mediavine' | 'shortcode'
type ShortcodePhase = 'idle' | 'typing' | 'done'

const videoTypes = [
  { id: 'mediavine' as const, label: 'Mediavine' },
  { id: 'youtube' as const, label: 'YouTube' },
  { id: 'shortcode' as const, label: 'Shortcode' },
]

const selectedType = ref<VideoType | null>(null)
const shortcodePhase = ref<ShortcodePhase>('idle')
const shortcodeText = ref('')
let shortcodeTimeouts: ReturnType<typeof setTimeout>[] = []

const SHORTCODE = '[video_player id="8472" src="pasta-recipe.mp4"]'

const selectType = (type: VideoType) => {
  selectedType.value = type
  shortcodeTimeouts.forEach(clearTimeout)
  shortcodeTimeouts = []
  shortcodePhase.value = 'idle'
  shortcodeText.value = ''

  if (type === 'shortcode') {
    // Start typing animation after a short delay
    shortcodeTimeouts.push(setTimeout(() => {
      shortcodePhase.value = 'typing'
      let charIndex = 0

      const typeInterval = setInterval(() => {
        charIndex++
        shortcodeText.value = SHORTCODE.slice(0, charIndex)

        if (charIndex >= SHORTCODE.length) {
          clearInterval(typeInterval)
          shortcodeTimeouts.push(setTimeout(() => {
            shortcodePhase.value = 'done'
          }, 300))
        }
      }, 30)
    }, 400))
  }
}

onUnmounted(() => shortcodeTimeouts.forEach(clearTimeout))
</script>
