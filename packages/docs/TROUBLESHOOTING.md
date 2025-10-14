# Troubleshooting Guide

## CSS Import Error

**Error**: `Cannot find module '~/assets/main.css'`

**Solution**: The `.nuxt` cache directory has been cleared. Restart the dev server:

```bash
# Stop the current server (Ctrl+C or Cmd+C)
npm run dev:docs
```

The CSS path in `nuxt.config.ts` is now set to `assets/main.css` (without `~/` prefix).

## Dev Server Port

The docs site is configured to run on port 3002, but will use port 3000 if 3002 is unavailable.

## Common Issues

### 1. Module not found errors
- Clear the `.nuxt` cache: `rm -rf .nuxt`
- Clear node_modules: `rm -rf node_modules && npm install`
- Restart the dev server

### 2. Tailwind styles not loading
- Check that `assets/main.css` exists
- Verify `nuxt.config.ts` has `css: ['assets/main.css']`
- Check PostCSS is configured correctly in `nuxt.config.ts`

### 3. Components not found
- Nuxt auto-imports components from `components/` directory
- No manual imports needed
- Check component file names match usage (case-sensitive)

### 4. Dark mode not working
- ThemeSelector uses `@vueuse/core`
- Theme is persisted to localStorage
- Check browser console for errors

## Verification Checklist

After restart, verify:

- [ ] Dev server starts without errors
- [ ] Homepage loads at http://localhost:3002 (or :3000)
- [ ] Navigation sidebar is visible
- [ ] Theme toggle works (light/dark)
- [ ] Mobile menu opens
- [ ] No console errors

## File Structure Verification

Ensure these files exist:

```
packages/docs/
├── assets/main.css            ← CSS file must be here
├── app.vue
├── nuxt.config.ts
├── pages/index.vue
└── components/
    ├── Logo.vue
    ├── Navigation.vue
    ├── MobileNavigation.vue
    └── ThemeSelector.vue
```

## Next Steps

Once the server is running:

1. Navigate to http://localhost:3002
2. Test theme toggle
3. Test mobile navigation
4. Start adding content to `content/docs/`

## Getting Help

If issues persist:
1. Check Nuxt logs for specific errors
2. Verify all dependencies installed: `npm install`
3. Check Node version: `node -v` (should be 18+)
4. Clear all caches: `rm -rf .nuxt node_modules && npm install`
