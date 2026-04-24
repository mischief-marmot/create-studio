// The h3/nuxt-auth-utils session layer sets a `nuxt-session` cookie on every
// response. For `/embed/*` assets we want the response to be safe to cache at
// the Cloudflare edge — a shared Set-Cookie would leak one visitor's session to
// everyone hitting the same cached entry.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (event.path?.startsWith('/embed/')) {
      removeResponseHeader(event, 'set-cookie')
    }
  })
})
