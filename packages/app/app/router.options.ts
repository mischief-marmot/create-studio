import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    // If there's a saved position (browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }

    // Check if this page uses hash-based tabs (any page in /admin)
    const usesHashTabs = to.path.startsWith('/admin')

    // If on a hash-tab page and navigating to a hash on the same page, don't scroll
    if (usesHashTabs && to.hash && to.path === from.path) {
      return false
    }

    // If there's a hash and it's NOT a hash-tab page, try to scroll to it
    if (to.hash && !usesHashTabs) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    // Default: scroll to top
    return { top: 0 }
  },
}
