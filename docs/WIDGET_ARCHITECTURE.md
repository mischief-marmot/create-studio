# Widget Architecture - Single Source of Truth

**Date**: October 10, 2025
**Status**: ✅ Complete

## Overview

The widget architecture has been refactored to maintain a **single source of truth** for all widget code. The app package no longer maintains duplicate widget components.

## Architecture

### Packages Structure

```
packages/
├── shared/           # Shared utilities, types, storage
├── widgets/          # Widget components (SINGLE SOURCE)
│   ├── src/
│   │   ├── components/
│   │   │   ├── InteractiveMode/
│   │   │   │   └── InteractiveModeWidget.vue
│   │   │   ├── ServingsAdjuster/
│   │   │   │   └── ServingsAdjusterWidget.vue
│   │   │   ├── InteractiveExperience.vue
│   │   │   ├── RecipeMedia.vue
│   │   │   ├── RecipeTimer.vue
│   │   │   ├── StarRating.vue
│   │   │   ├── ActiveTimers.vue
│   │   │   └── ...
│   │   ├── composables/
│   │   │   ├── useSharedTimerManager.ts
│   │   │   ├── useRecipeUtils.ts
│   │   │   └── ...
│   │   └── lib/widget-sdk/
│   └── dist/         # Built widgets for embedding
│       ├── main.js
│       ├── entry.css
│       ├── interactive-mode.js
│       └── servings-adjuster.js
│
└── app/              # Nuxt application
    └── pages/creations/[creationKey]/
        └── interactive.vue  # Uses widget SDK
```

### How It Works

#### 1. Widget Package (Source)
- Contains all widget components with **Tailwind `cs:` prefixed classes**
- Builds standalone ES modules for embedding
- No scoped styles - everything uses Tailwind utilities
- Uploaded to blob storage for CDN serving

#### 2. App Package (Consumer)
- **Removed duplicate components**: InteractiveExperience, RecipeTimer, etc.
- **Removed widget composables**: useSharedTimerManager, useRecipeUtils, etc.
- App's interactive page loads and mounts the widget SDK

#### 3. Interactive Page Pattern

The `/creations/[creationKey]/interactive` page:

```vue
<script setup>
// Load widget SDK
useScript({
    src: '/embed/main.js',
    async: true
});

onMounted(async () => {
    // Wait for SDK
    await waitForSDK();

    // Initialize
    await window.CreateStudio.init({
        siteUrl: creationInfo.domain,
        baseUrl: window.location.origin,
        debug: true
    });

    // Mount widget
    await window.CreateStudio.mount('interactive-mode', targetElement, {
        creationId: creationInfo.creationId,
        siteUrl: creationInfo.domain
    });

    // Auto-open modal
    button.click();
});
</script>
```

## Benefits

### ✅ Single Source of Truth
- Widget code exists **only in `/packages/widgets/`**
- No duplicate files to maintain
- Changes apply everywhere automatically

### ✅ Consistency
- App's interactive page renders **exactly the same** as embedded widgets
- Same styling, same behavior, same bugs (if any!)

### ✅ Easier Maintenance
- Update widget once, works everywhere:
  - Embedded on publisher sites
  - App's own interactive pages
  - Testing environment

### ✅ Tailwind cs: Prefix Working Correctly
- All widget styles use `cs:` prefixed Tailwind classes
- No scoped CSS to interfere
- Proper isolation from publisher site styles

## Widget Styling Guidelines

### ❌ DON'T: Scoped Styles

```vue
<style scoped>
.cs-modal-container {
  position: fixed !important;
  background: #f3f4f6 !important;
}
</style>
```

### ✅ DO: Tailwind cs: Classes

```vue
<div class="cs:fixed cs:bg-gray-100">
  <button class="cs:bg-primary cs:text-primary-content">
    Click me
  </button>
</div>
```

### DaisyUI Integration

```vue
<!-- Use DaisyUI component classes with cs: prefix -->
<button class="cs:btn cs:btn-primary">
<div class="cs:card cs:card-compact">
<div class="cs:modal cs:modal-open">
```

## Build Process

### 1. Widget Build
```bash
cd packages/widgets
npm run build
```

**Output:**
- `dist/main.js` - SDK entry point (18KB)
- `dist/entry.css` - All styles with cs: prefix (27KB)
- `dist/interactive-mode.js` - Interactive mode chunk (181KB)
- `dist/servings-adjuster.js` - Servings adjuster chunk (8KB)

**Upload:**
- Automatically uploads to blob storage (`/embed/*`)
- Served via `/embed/[filename]` route

### 2. App Build
```bash
cd packages/app
npm run build
```

- No widget building
- Loads widgets from blob storage at runtime

## Testing

### Test Widget in Isolation
1. Build widgets: `npm run build:widgets`
2. Start dev server: `npm run dev`
3. Visit: `http://localhost:3001/creations/[domain]-[id]/interactive`
4. Widget loads from blob and auto-opens

### Test Embedded Widget
1. Build widgets: `npm run build:widgets`
2. Add to publisher HTML:
```html
<script src="http://localhost:3001/embed/main.js"></script>
<script>
  CreateStudio.init({ siteUrl: 'example.com' })
    .then(() => CreateStudio.mountInteractiveMode());
</script>
```

## Migration Benefits

### Before Migration
- **Duplicate code**: InteractiveExperience in both app and widgets
- **Scoped styles**: Hardcoded CSS with !important
- **Maintenance burden**: Update 2 places for every change

### After Migration
- **Single source**: Widget code only in `/packages/widgets/`
- **Tailwind cs:**: All styles via prefixed utilities
- **Easy updates**: Change once, works everywhere

## Future Enhancements

### Potential Improvements
1. **Version management**: Add widget versioning to SDK
2. **Hot reload**: Widget changes update without rebuild
3. **A/B testing**: Load different widget versions
4. **Analytics**: Track widget performance metrics

### Architecture Decisions
- Keep widgets and app separate (monorepo structure)
- Use blob storage for widget CDN
- Tailwind cs: prefix for style isolation
- Single widget build consumed by app

---

**Last Updated**: October 10, 2025
**Maintained By**: Create Studio Team
