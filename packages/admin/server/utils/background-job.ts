/**
 * Background job execution utility
 *
 * Dispatches async work to run after the HTTP response is sent.
 * In production (Cloudflare Workers): uses waitUntil() to keep the worker alive.
 * In local dev: runs the promise without awaiting it.
 */
import type { H3Event } from 'h3'

/**
 * Run an async function in the background after the response is sent.
 * The function will continue executing even after the HTTP response is returned.
 *
 * @param event - H3 event (used to access Cloudflare's waitUntil in production)
 * @param fn - Async function to run in the background
 */
export function runInBackground(event: H3Event, fn: () => Promise<void>): void {
  const promise = fn().catch((err) => {
    console.error('[background-job] Unhandled error:', err)
  })

  // In Cloudflare Workers, use waitUntil() to keep the worker alive
  const cfCtx = (event.context as any).cloudflare?.context
  if (cfCtx?.waitUntil) {
    cfCtx.waitUntil(promise)
    return
  }

  // In Nitro dev, event.waitUntil may be available
  if (typeof (event as any).waitUntil === 'function') {
    ;(event as any).waitUntil(promise)
    return
  }

  // Fallback: the promise runs detached (Node.js keeps the event loop alive
  // as long as there are pending promises with active I/O)
}
