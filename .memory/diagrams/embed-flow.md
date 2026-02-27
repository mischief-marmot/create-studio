# Create Studio Embed Flow

## Overview

The embed system delivers interactive widgets to WordPress sites with Create Pro cards. Files are stored in NuxtHub blob storage and served via a Nitro route.

## Request Flow (Current — Optimized)

Preload hints emitted in `<head>` allow `main.js` and `entry.css` to be fetched in
parallel during HTML parsing, eliminating the previous chained dependency.

```
HTML parse begins
  ├─ <link rel="preconnect" href="https://create.studio">   ← TCP+TLS established early
  ├─ <link rel="preload" as="script" href="/embed/main.js"> ← fetched immediately
  └─ <link rel="preload" as="style"  href="/embed/entry.css"> ← fetched in parallel
       (production only — debug mode skips CSS preload due to unpredictable cache-bust URL)

HTML parse completes → DOMContentLoaded fires

  ├─ main.js executes (already in cache from preload)
  │   ├─ loadWidgetCSS()
  │   │   ├─ checks for link[rel="stylesheet"][href*="entry.css"] (not found yet)
  │   │   └─ createElement('link', rel=stylesheet) → served from preload cache
  │   │
  │   └─ CreateStudio.init({ siteUrl })
  │       ├─ configManager.loadSiteConfig()
  │       │   └─ GET /api/v2/sites/{siteId}/config
  │       ├─ storageManager.init()
  │       └─ injectThemeStyles()
  │
  ├─ CreateStudio.mountInteractiveMode()
  │   └─ dynamic import → GET /embed/interactive-mode.js   ← lazy-loaded
  │
  ├─ CreateStudio.mountServingsAdjuster()
  │   └─ dynamic import → GET /embed/servings-adjuster.js  ← lazy-loaded
  │
  └─ CreateStudio.mountUnitConversion()
      └─ dynamic import → GET /embed/unit-conversion.js   ← lazy-loaded
```

## WordPress Plugin HTML Output

```html
<!-- <head> — priority 5, emitted by enqueue_studio_script() -->
<link rel="preconnect" href="https://create.studio" crossorigin>
<link rel="preload" href="https://create.studio/embed/main.js" as="script" crossorigin>
<link rel="preload" href="https://create.studio/embed/entry.css" as="style">
<!-- ^ production only; omitted in debug mode (JS uses ?v=Date.getTime() cache-bust) -->

<!-- footer — local plugin bundle -->
<script async data-noptimize src=".../bundle.VERSION.js"></script>

<!-- footer — Create Studio embed -->
<script defer type="module" id="create-studio-embed"
    data-site-url="https://example.com"
    src="https://create.studio/embed/main.js">
</script>
```

Note: `crossorigin` is on the `main.js` preload (modules are always CORS) but intentionally
**absent** from the `entry.css` preload — the dynamically-created `<link rel="stylesheet">`
in JS has no `crossorigin`, so the request modes must match for the preload cache to be used.

## CSS Loading Guard (entry.ts)

```typescript
function loadWidgetCSS() {
  // Must match rel="stylesheet" specifically — rel="preload" links also match
  // href*="entry.css", so a broader selector would bail out prematurely.
  if (document.querySelector('link[rel="stylesheet"][href*="entry.css"]')) {
    return
  }
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `${baseUrl}/embed/entry.css${debug ? '?v=' + cacheBust : ''}`
  document.head.appendChild(link)
}
```

## File Locations

| Purpose | Path |
|---------|------|
| WordPress embed enqueue + preload hints | `plugins/create/lib/creations/class-creations-views.php` |
| Embed route handler | `packages/app/server/routes/embed/[...pathname].get.ts` |
| Blob serving utility | `packages/app/server/utils/serveBlobFile.ts` |
| Widget entry point (CSS loading) | `packages/widgets/src/entry.ts` |
| WidgetSDK init | `packages/widgets/src/lib/widget-sdk/index.ts` |
| Widget build config | `packages/widgets/vite.config.ts` |
| Upload endpoint | `packages/app/server/api/v2/upload-widget.post.ts` |
| Nuxt preload plugin (Create Studio app only) | `packages/app/server/plugins/remove-embed-preload.ts` |

## Built Widget Files (Blob Storage)

```
entry.css            ~14 KB  (all component styles)
main.js              ~9 KB   (entry point + shared code)
interactive-mode.js  ~246 KB (lazy-loaded on mount)
servings-adjuster.js ~5.8 KB (lazy-loaded on mount)
unit-conversion.js   ~4.3 KB (lazy-loaded on mount)
```

## Key Gotchas

- **No `crossorigin` on CSS preload** — must match the dynamically-created stylesheet link,
  which has no `crossorigin`. Mismatching CORS modes cause a cache miss and double-fetch.
- **Debug mode skips CSS preload** — JS uses `Date.getTime()` (ms) for cache-busting;
  PHP uses `time()` (s), so the URLs can never match. Preload would be wasted.
- **Preload removal plugin is Create Studio-only** — `remove-embed-preload.ts` converts
  Nuxt's auto-generated preloads for the Studio app itself. It does not affect WordPress sites.
