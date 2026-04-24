// The h3/nuxt-auth-utils session layer sets a `nuxt-session` cookie on every
// response. For public, edge-cacheable endpoints we must strip it — a shared
// Set-Cookie baked into a cached entry would hand the same session to every
// visitor hitting that entry.
const CACHEABLE_PREFIXES = [
  '/embed/',
  '/api/v2/site-config/',
]

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    const path = event.path
    if (!path) return
    if (CACHEABLE_PREFIXES.some((p) => path.startsWith(p))) {
      removeResponseHeader(event, 'set-cookie')
    }
  })
})
