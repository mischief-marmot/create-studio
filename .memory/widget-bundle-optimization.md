# Widget Bundle Optimization Plan

> **Baseline (after quick wins):** interactive-mode.js 146 KB minified / 47.7 KB gzipped
> **Previous:** 247 KB minified / ~80 KB gzipped (before terser + quick wins)

## Completed

- [x] Add proper minification with @rollup/plugin-terser (157→146 KB isn't right, was 247→157)
- [x] Disable Vue Options API (`__VUE_OPTIONS_API__: false`) — ~5-8 KB gzip savings
- [x] Replace consola with minimal custom logger — ~3 KB gzip savings
- [x] Add bundle analyzer (`npm run analyze` in packages/widgets)

## Phase 1: Medium Refactors (~3-5 KB gzip savings)

### Deduplicate timer interval logic in useSharedTimerManager.ts
- `startTimer` (lines ~171-262) and `resumeTimer` (lines ~317-382) have ~80 lines of identical interval setup code
- Extract to private `_startTimerInterval(id, timer)` helper
- Also consolidate the `timers.value = new Map(timers.value)` reactivity trigger (appears 15+ times) into a helper

### Tree-shake SharedStorageManager
- 17 of 39 methods are unused by widgets: `resetCreation`, `clearAllState`, `clearAll`, `getAllCreationStates`, `getPreferences`, `updatePreferences`, `getPreference`, `setPreference`, `isDismissed`, `dismissAlert`, `clearTimers`, `getCurrentCreationKey`, `getStorageId`, `exportData`, `importData`
- Option A: Create a widget-specific facade that only re-exports used methods
- Option B: Split into CoreStorageManager (used by widgets) + SharedStorageManager extends Core (app-only extras)
- Source file: `packages/shared/src/lib/shared-storage/shared-storage-manager.ts` (769 lines)

## Phase 2: Component Splitting (~7-10 KB gzip savings)

### Lazy-load Review System from InteractiveExperience.vue
- Review slide UI + form + StarRating only needed when user reaches final slide
- Extract to `ReviewSlide.vue`, load with `defineAsyncComponent()`
- Template lines ~157-247, script lines ~1183-1355 (~350 lines total)
- Biggest single win in app code

### Extract carousel navigation composable
- Scroll detection, keyboard nav, touch/scroll syncing, slide navigation (~200 lines)
- Create `useCarouselNavigation.ts` composable
- Reusable and independently testable

### Extract drag/image-collapse logic
- Mobile-only drag handling for image collapse (~150 lines, 4KB)
- Create `useImageCollapse.ts` composable
- Could potentially be tree-shaken on desktop-only paths

## Not Worth Pursuing

- **Inline heroicons SVGs**: Only ~0.3 KB gzip savings for 12 icons, maintenance cost too high
- **Vue runtime reduction**: 67% of bundle is Vue itself, can't avoid without rewrite to vanilla JS
- **Remove logging entirely**: Useful for debugging embeds on publisher sites

## Bundle Composition Reference

From source map analysis (source sizes, not minified):

| Category | Source Size | % |
|---|---|---|
| @vue/runtime-core | 262 KB | 44% |
| App code | 177 KB | 30% |
| @vue/runtime-dom | 58 KB | 10% |
| @vue/reactivity | 52 KB | 9% |
| @vue/shared | 22 KB | 4% |
| ~~consola~~ (removed) | ~~15 KB~~ | ~~3%~~ |
| @heroicons/vue | 7 KB | 1% |

### Largest app code modules
| Module | Source Size |
|---|---|
| InteractiveExperience.vue | 58 KB |
| shared-storage-manager.ts | 21 KB |
| useSharedTimerManager.ts | 17 KB |
| InteractiveModeWidget.vue | 15 KB |
