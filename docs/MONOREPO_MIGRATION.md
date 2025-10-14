# Create Studio Monorepo Migration Guide

## Overview
This guide documents the complete migration from a single Nuxt app to a monorepo with three separate packages:
- `@create-studio/shared` - Shared utilities, types, and storage (no framework dependencies)
- `@create-studio/widgets` - Vue 3 widget library with Custom Elements (no Nuxt dependencies)
- `@create-studio/app` - Nuxt.js application (main site)

## Current Status

### ✅ COMPLETED

#### Phase 1: Monorepo Infrastructure
- [x] Created npm workspaces configuration in root `package.json`
- [x] Set up `packages/` directory structure
- [x] Created workspace scripts for building, testing, and development

#### Phase 2: @create-studio/shared Package (Partial)
- [x] Created `packages/shared/package.json`
- [x] Created `packages/shared/tsconfig.json`
- [x] Created `packages/shared/vitest.config.ts`
- [x] Copied shared code to `packages/shared/src/`
  - [x] `shared/lib/` → `packages/shared/src/lib/`
  - [x] `shared/utils/` → `packages/shared/src/utils/`
  - [x] `types/` → `packages/shared/src/types/`
- [x] Created `packages/shared/src/index.ts` with exports

### ⏳ REMAINING WORK

## Phase 2 (Continued): Complete @create-studio/shared

### Step 1: Install Dependencies and Build
```bash
cd /Users/jm/Sites/create-studio
npm install
npm run build:shared
```

### Step 2: Remove widget-sdk from shared (it belongs in widgets package)
```bash
# Remove widget-sdk as it's widget-specific, not shared
rm -rf packages/shared/src/lib/widget-sdk
```

### Step 3: Update shared package index.ts
Edit `packages/shared/src/index.ts` to remove widget-sdk exports (already done).

---

## Phase 3: Create @create-studio/widgets Package

### Step 1: Create Widget Package Structure

```bash
cd /Users/jm/Sites/create-studio/packages/widgets
mkdir -p src/{components,composables,lib}
```

### Step 2: Create `packages/widgets/package.json`

```json
{
  "name": "@create-studio/widgets",
  "version": "0.0.2",
  "private": true,
  "type": "module",
  "main": "./dist/main.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "dev": "vite build --watch --mode development",
    "build": "vite build && node scripts/upload.mjs",
    "build:custom-elements": "vite build --config vite.custom-elements.config.ts",
    "clean": "rm -rf dist",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "@create-studio/shared": "workspace:*",
    "@heroicons/vue": "^2.2.0",
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.6",
    "@vitejs/plugin-vue": "^5.2.1",
    "@vue/test-utils": "^2.4.6",
    "autoprefixer": "^10.4.20",
    "daisyui": "^5.0.35",
    "tailwindcss": "^4.1.6",
    "typescript": "^5.6.0",
    "vite": "^6.0.5",
    "vitest": "^3.2.4",
    "vue-tsc": "^2.1.0"
  }
}
```

### Step 3: Create Widget Build Configs

**`packages/widgets/vite.config.ts`** (for chunked ES modules build):

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entry.ts'),
      name: 'CreateStudio',
      fileName: () => 'main.js',
      formats: ['es']
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        assetFileNames: '[name].[ext]',
        chunkFileNames: '[name].js',
        entryFileNames: 'main.js',
        inlineDynamicImports: false,
        manualChunks(id) {
          if (id.includes('InteractiveModeWidget') ||
              id.includes('InteractiveExperience') ||
              id.includes('RecipeSkeletonLoader') ||
              id.includes('RecipeMedia') ||
              id.includes('DraggableHandle') ||
              id.includes('RecipeTimer') ||
              id.includes('StarRating') ||
              id.includes('Logo/Solo') ||
              id.includes('ActiveTimers')) {
            return 'interactive-mode'
          }
          if (id.includes('ServingsAdjusterWidget')) {
            return 'servings-adjuster'
          }
          return undefined
        }
      }
    },
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer()
      ]
    }
  },
  resolve: {
    alias: {
      '@': __dirname,
      '~': __dirname,
      '@create-studio/shared': resolve(__dirname, '../shared/src'),
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    '__VUE_OPTIONS_API__': 'true',
    '__VUE_PROD_DEVTOOLS__': 'false',
  }
})
```

**`packages/widgets/vite.custom-elements.config.ts`** (for Web Components build):

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('cs-')
        }
      },
      customElement: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/custom-elements.ts'),
      name: 'CreateStudioElements',
      fileName: () => 'custom-elements.js',
      formats: ['es']
    },
    outDir: 'dist/custom-elements',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        inlineDynamicImports: true
      }
    }
  },
  resolve: {
    alias: {
      '@create-studio/shared': resolve(__dirname, '../shared/src'),
    }
  }
})
```

### Step 4: Create Widget TypeScript Config

**`packages/widgets/tsconfig.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "jsx": "preserve",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "types": ["vite/client", "vitest/globals"],
    "paths": {
      "@create-studio/shared": ["../shared/src"],
      "@create-studio/shared/*": ["../shared/src/*"]
    }
  },
  "include": ["src/**/*", "*.config.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### Step 5: Create Widget Tailwind Config

**`packages/widgets/tailwind.config.js`**:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Step 6: Create Widget Styles

**`packages/widgets/widget.css`**:

```css
@import "tailwindcss" prefix(cs);
@plugin "daisyui";

/* Additional widget-specific styles */
```

### Step 7: Move Widget Code

```bash
# Move widget components
cp -r app/components/widgets/* packages/widgets/src/components/

# Move InteractiveExperience and its dependencies
cp app/components/InteractiveExperience.vue packages/widgets/src/components/
cp app/components/RecipeMedia.vue packages/widgets/src/components/
cp app/components/RecipeTimer.vue packages/widgets/src/components/
cp app/components/StarRating.vue packages/widgets/src/components/
cp app/components/ActiveTimers.vue packages/widgets/src/components/
cp app/components/DraggableHandle.vue packages/widgets/src/components/
cp app/components/RecipeSkeletonLoader.vue packages/widgets/src/components/
cp -r app/components/Logo packages/widgets/src/components/

# Move widget composables
cp app/composables/useSharedTimerManager.ts packages/widgets/src/composables/
cp app/composables/useRecipeUtils.ts packages/widgets/src/composables/
cp app/composables/useReviewStorage.ts packages/widgets/src/composables/
cp app/composables/useReviewSubmission.ts packages/widgets/src/composables/

# Move widget SDK
cp -r shared/lib/widget-sdk packages/widgets/src/lib/

# Move widget entry point
cp widget-entry.ts packages/widgets/src/entry.ts

# Copy build script
cp scripts/build-widget.mjs packages/widgets/scripts/upload.mjs
```

### Step 8: Update Widget Imports

All widget files need to be updated to:
1. Import Vue explicitly: `import { ref, computed, watch } from 'vue'`
2. Change `#shared/...` imports to `@create-studio/shared/...`
3. Update relative imports for new structure

**Automated import update script** (`packages/widgets/scripts/fix-imports.mjs`):

```javascript
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function updateImports(filePath) {
  let content = readFileSync(filePath, 'utf-8')

  // Replace #shared imports with @create-studio/shared
  content = content.replace(/#shared\//g, '@create-studio/shared/')

  // Replace ~/ imports with relative paths (this needs manual review)
  // content = content.replace(/~\//g, '../')

  writeFileSync(filePath, content, 'utf-8')
  console.log(`Updated: ${filePath}`)
}

function processDirectory(dir) {
  const files = readdirSync(dir)

  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      processDirectory(filePath)
    } else if (file.endsWith('.ts') || file.endsWith('.vue')) {
      updateImports(filePath)
    }
  }
}

processDirectory('./src')
console.log('✓ Import paths updated')
```

Run it:
```bash
cd packages/widgets
node scripts/fix-imports.mjs
```

### Step 9: Create Widget Entry Points

**`packages/widgets/src/entry.ts`** (chunked SDK build):

```typescript
import { createWidgetSDK } from './lib/widget-sdk'

// Register widgets
import InteractiveModeWidget from './components/InteractiveMode/InteractiveModeWidget.vue'
import ServingsAdjusterWidget from './components/ServingsAdjuster/ServingsAdjusterWidget.vue'

const sdk = createWidgetSDK()
sdk.registerWidget('interactive-mode', InteractiveModeWidget)
sdk.registerWidget('servings-adjuster', ServingsAdjusterWidget)

// Export for use
export default sdk

// Mount automatically if called via script tag
if (typeof window !== 'undefined') {
  (window as any).CreateStudio = sdk
}
```

**`packages/widgets/src/custom-elements.ts`** (Web Components build):

```typescript
import { defineCustomElement } from 'vue'
import InteractiveModeWidget from './components/InteractiveMode/InteractiveModeWidget.ce.vue'
import ServingsAdjusterWidget from './components/ServingsAdjuster/ServingsAdjusterWidget.ce.vue'

// Define custom elements
const InteractiveModeElement = defineCustomElement(InteractiveModeWidget)
const ServingsAdjusterElement = defineCustomElement(ServingsAdjusterWidget)

// Register custom elements
customElements.define('cs-interactive-mode', InteractiveModeElement)
customElements.define('cs-servings-adjuster', ServingsAdjusterElement)

export {
  InteractiveModeElement,
  ServingsAdjusterElement
}
```

### Step 10: Create vitest Config

**`packages/widgets/vitest.config.ts`**:

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
  },
  resolve: {
    alias: {
      '@create-studio/shared': resolve(__dirname, '../shared/src'),
    }
  }
})
```

### Step 11: Build and Test Widgets

```bash
cd packages/widgets
npm run build
```

---

## Phase 4: Migrate @create-studio/app Package

### Step 1: Create App Package Directory

```bash
mkdir -p packages/app
```

### Step 2: Move App Files

```bash
# Move main Nuxt directories
mv app packages/app/
mv server packages/app/
mv public packages/app/
mv pages packages/app/  # if not using app/pages

# Move config files
mv nuxt.config.ts packages/app/
mv vitest.config.ts packages/app/
mv eslint.config.mjs packages/app/
mv tsconfig.json packages/app/

# Move tests
mv tests packages/app/

# Move assets
# (already in app/ directory)
```

### Step 3: Create `packages/app/package.json`

```json
{
  "name": "@create-studio/app",
  "version": "0.0.2",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev --host --port 3001",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:e2e": "vitest run tests/e2e",
    "test:unit": "vitest run tests/unit",
    "test:components": "vitest run tests/components",
    "lint": "eslint .",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "@create-studio/shared": "workspace:*",
    "@headlessui/vue": "^1.7.23",
    "@heroicons/vue": "^2.2.0",
    "@nuxt/eslint": "^1.3.1",
    "@nuxt/image": "^1.10.0",
    "@nuxt/scripts": "^0.11.13",
    "@nuxthub/core": "^0.9.0",
    "@pinia/nuxt": "^0.11.0",
    "@postlight/parser": "^2.2.3",
    "@tailwindcss/vite": "^4.1.6",
    "@tailwindplus/elements": "^1.0.1",
    "@unhead/vue": "^2.0.14",
    "@vue-email/components": "^0.0.21",
    "axios": "^1.12.2",
    "bcryptjs": "^3.0.2",
    "cheerio": "^1.1.2",
    "crypto-js": "^4.2.0",
    "jose": "^6.1.0",
    "nuxt": "^4.0.0",
    "nuxt-auth-utils": "^0.5.25",
    "pinia": "^3.0.2",
    "pinia-plugin-persistedstate": "^4.5.0",
    "postmark": "^4.0.5",
    "round-precision": "^1.0.0",
    "stripe": "^19.1.0",
    "tailwindcss": "^4.1.6",
    "vue": "^3.5.13",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "@nuxt/test-utils": "^3.19.2",
    "@tailwindcss/postcss": "^4.1.13",
    "@types/crypto-js": "^4.2.2",
    "@vitejs/plugin-vue": "^5.2.1",
    "@vue/test-utils": "^2.4.6",
    "chokidar": "^4.0.3",
    "daisyui": "^5.0.35",
    "eslint": "^9.26.0",
    "happy-dom": "^18.0.1",
    "playwright-core": "^1.55.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.5",
    "vitest": "^3.2.4",
    "wrangler": "^4.20.5"
  }
}
```

### Step 4: Update App Imports

**Automated import update script** (`packages/app/scripts/fix-imports.mjs`):

```javascript
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function updateImports(filePath) {
  let content = readFileSync(filePath, 'utf-8')

  // Replace #shared imports with @create-studio/shared
  content = content.replace(/#shared\//g, '@create-studio/shared/')

  writeFileSync(filePath, content, 'utf-8')
  console.log(`Updated: ${filePath}`)
}

function processDirectory(dir) {
  const files = readdirSync(dir)

  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      processDirectory(filePath)
    } else if (file.endsWith('.ts') || file.endsWith('.vue')) {
      updateImports(filePath)
    }
  }
}

// Process server directory
processDirectory('./server')
console.log('✓ Import paths updated')
```

Run it:
```bash
cd packages/app
node scripts/fix-imports.mjs
```

### Step 5: Update Nuxt Config

Edit `packages/app/nuxt.config.ts`:

1. Remove widget building hooks (widgets build separately now)
2. Add TypeScript path for @create-studio/shared
3. Update any hardcoded paths

**Key changes**:

```typescript
// Remove these hooks:
hooks: {
  'build:done': async () => { /* REMOVE */ },
  ready: async (nuxt) => { /* REMOVE widget watcher */ }
}

// Keep the rest of the config as-is
```

### Step 6: Update App tsconfig.json

Edit `packages/app/tsconfig.json`:

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "moduleResolution": "nodenext",
    "paths": {
      "@create-studio/shared": ["../shared/src"],
      "@create-studio/shared/*": ["../shared/src/*"]
    }
  }
}
```

---

## Phase 5: Update API Endpoints

### Fix Bug in site-config.post.ts

**`packages/app/server/api/v2/site-config.post.ts`** line 56:

```typescript
// BEFORE (BUG):
inDomRendering: renderMode !== 'in-dom',

// AFTER (FIXED):
inDomRendering: renderMode === 'in-dom',
```

### Update Widget Upload Endpoint

**`packages/app/server/api/v2/upload-widget.post.ts`**:

No changes needed - continues to work with blob storage.

### Update Widget Serving Route

**`packages/app/server/routes/embed/[...pathname].get.ts`**:

Already updated - serves from blob storage.

---

## Phase 6: Configure Tooling

### Root TypeScript Config

**`tsconfig.json`** (in root):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "paths": {
      "@create-studio/shared": ["./packages/shared/src"],
      "@create-studio/shared/*": ["./packages/shared/src/*"],
      "@create-studio/widgets": ["./packages/widgets/src"],
      "@create-studio/widgets/*": ["./packages/widgets/src/*"]
    }
  },
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/widgets" },
    { "path": "./packages/app" }
  ]
}
```

### Update .gitignore

Add to `.gitignore`:

```gitignore
# Package build artifacts
packages/*/dist
packages/*/.nuxt
packages/*/node_modules

# Keep root node_modules in gitignore
node_modules
```

### Environment Variables

Keep `.env` at root - all packages can access it.

---

## Phase 7: Testing & Validation

### Step 1: Install All Dependencies

```bash
cd /Users/jm/Sites/create-studio
rm -rf node_modules package-lock.json
npm install
```

### Step 2: Build All Packages

```bash
# Build in correct order (respecting dependencies)
npm run build:shared
npm run build:widgets
npm run build:app
```

### Step 3: Test Widgets Independently

```bash
npm run test:widgets
```

### Step 4: Start App Development Server

```bash
npm run dev
```

### Step 5: Test Integration

1. **Test Free Tier (iframe)**:
   - Load a creation with free tier site
   - Verify interactive mode opens in iframe
   - Verify Create Studio ads show

2. **Test Pro Tier (in-DOM)**:
   - Load a creation with pro tier site
   - Verify interactive mode renders in-DOM
   - Verify publisher ads can run
   - Verify no CSS conflicts with `cs:` prefix

### Step 6: Run All Tests

```bash
npm test
```

---

## Rollback Plan

If any issues arise:

```bash
# Create backup branch before starting
git checkout -b backup/pre-monorepo

# If you need to rollback:
git checkout backup/pre-monorepo
```

Or restore from this commit: [Insert current commit hash]

---

## Post-Migration Cleanup

After successful migration and testing:

```bash
# Remove old directories
rm -rf shared/
rm -rf types/
rm -rf widget-entry.ts
rm -rf widget.css
rm -rf tailwind.widget.config.js
rm -rf scripts/build-widget.mjs

# Remove old app files from root (now in packages/app/)
# Keep: README.md, .env, .gitignore, LICENSE, etc.
```

---

## Benefits Achieved

1. ✅ **Clean Separation**: Widgets can't accidentally use Nuxt features
2. ✅ **Independent Development**: Build and test widgets without running Nuxt app
3. ✅ **Better Type Safety**: Explicit imports prevent runtime errors
4. ✅ **Easier Testing**: Each package tested in isolation
5. ✅ **Future Publishing**: Can publish `@create-studio/widgets` to npm later
6. ✅ **Clear Dependencies**: Package boundaries enforce architectural rules
7. ✅ **Faster Builds**: Only rebuild changed packages
8. ✅ **Better DevEx**: IDE understands package boundaries

---

## Troubleshooting

### Issue: "Cannot find module '@create-studio/shared'"

**Solution**: Build the shared package first:
```bash
npm run build:shared
```

### Issue: Widget build fails with "Cannot resolve 'vue'"

**Solution**: Ensure vue is in dependencies (not just devDependencies):
```bash
cd packages/widgets
npm install vue
```

### Issue: Nuxt app can't find components

**Solution**: Check Nuxt auto-imports are working. May need to restart dev server.

### Issue: TypeScript errors about missing types

**Solution**: Run typecheck and install missing @types packages:
```bash
npm run typecheck
```

---

## Timeline

Estimated time for complete migration: **8-12 hours**

- Phase 1: ✅ Complete (30 min)
- Phase 2: ✅ Partial (30 min) → Remaining: 30 min
- Phase 3: ⏳ 3 hours (widget extraction + custom elements)
- Phase 4: ⏳ 3 hours (app migration)
- Phase 5: ⏳ 1 hour (API updates)
- Phase 6: ⏳ 1 hour (tooling)
- Phase 7: ⏳ 2 hours (testing)

---

## Next Steps

1. Review this migration guide
2. Create backup branch: `git checkout -b backup/pre-monorepo`
3. Commit current progress: `git add . && git commit -m "WIP: Monorepo migration Phase 1-2"`
4. Continue with Phase 2 (complete shared package)
5. Proceed through phases 3-7
6. Test thoroughly
7. Deploy!

---

## Questions or Issues?

Document any problems encountered during migration here for future reference.
