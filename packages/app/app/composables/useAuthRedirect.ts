/**
 * Stores and retrieves a post-auth redirect path via sessionStorage.
 *
 * Any auth page can call `storeRedirect()` on mount to capture a `?redirect=`
 * query param. After login/register completes, call `consumeRedirect()` to get
 * the stored path (returns it and clears storage). If nothing is stored, falls
 * back to the `?redirect=` query param on the current route.
 */

const STORAGE_KEY = 'auth_redirect'

export function useAuthRedirect() {
  const route = useRoute()

  /** Persist the redirect from the current URL's ?redirect= param (if present). */
  function storeRedirect() {
    if (import.meta.server) return
    const redirect = route.query.redirect as string | undefined
    if (redirect && redirect.startsWith('/')) {
      sessionStorage.setItem(STORAGE_KEY, redirect)
    }
  }

  /**
   * Return the stored redirect path and clear it.
   * Falls back to the current route's ?redirect= query param.
   */
  function consumeRedirect(): string | null {
    if (import.meta.server) {
      const query = route.query.redirect as string | undefined
      return query && query.startsWith('/') ? query : null
    }
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      sessionStorage.removeItem(STORAGE_KEY)
      return stored
    }
    const query = route.query.redirect as string | undefined
    return query && query.startsWith('/') ? query : null
  }

  return { storeRedirect, consumeRedirect }
}
