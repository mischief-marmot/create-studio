/// <reference types="@cloudflare/workers-types" />

import type { H3Event } from 'h3'
import { getCookie, setCookie } from 'h3'

/**
 * Admin environment types for multi-environment access
 */
export type AdminEnvironment = 'production' | 'preview'

/**
 * Cloudflare bindings available for admin operations
 */
export interface AdminEnvBindings {
  db: D1Database
  blob: R2Bucket
  kv: KVNamespace
  cache: KVNamespace
  environment: AdminEnvironment
  isLocal: boolean
}

/**
 * Cookie name for storing the selected admin environment
 */
const ADMIN_ENV_COOKIE = 'admin_environment'

/**
 * Get the current admin environment from the request cookie
 * Defaults to 'production' if not set or invalid
 *
 * @param event - H3 event from the request
 * @returns The current admin environment
 */
export function getAdminEnvironment(event: H3Event): AdminEnvironment {
  const envCookie = getCookie(event, ADMIN_ENV_COOKIE)

  // Validate the cookie value
  if (envCookie === 'preview') {
    return 'preview'
  }

  // Default to production for any invalid or missing value
  return 'production'
}

/**
 * Set the admin environment cookie
 *
 * @param event - H3 event from the request
 * @param env - The environment to set
 */
export function setAdminEnvironment(event: H3Event, env: AdminEnvironment): void {
  setCookie(event, ADMIN_ENV_COOKIE, env, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    // Set a long expiration (30 days) so preference persists
    maxAge: 60 * 60 * 24 * 30,
  })
}

/**
 * Get the Cloudflare bindings for the current admin environment
 * Returns appropriate bindings based on the selected environment (production or preview)
 *
 * In local development, cloudflare.env may not exist, so we handle that gracefully
 * by setting isLocal: true and returning undefined bindings.
 *
 * @param event - H3 event from the request
 * @returns Admin environment bindings with db, blob, kv, cache, and metadata
 */
export function useAdminEnv(event: H3Event): AdminEnvBindings {
  const environment = getAdminEnvironment(event)
  const cloudflareEnv = event.context.cloudflare?.env as Record<string, unknown> | undefined

  // Handle local development where cloudflare.env doesn't exist
  if (!cloudflareEnv) {
    return {
      db: undefined as unknown as D1Database,
      blob: undefined as unknown as R2Bucket,
      kv: undefined as unknown as KVNamespace,
      cache: undefined as unknown as KVNamespace,
      environment,
      isLocal: true,
    }
  }

  // For production environment, use the standard bindings
  if (environment === 'production') {
    return {
      db: cloudflareEnv.DB as D1Database,
      blob: cloudflareEnv.BLOB as R2Bucket,
      kv: cloudflareEnv.KV as KVNamespace,
      cache: cloudflareEnv.CACHE as KVNamespace,
      environment: 'production',
      isLocal: false,
    }
  }

  // For preview environment, use preview bindings with fallback to production
  // Preview bindings may not always be available, so we fall back gracefully
  return {
    db: (cloudflareEnv.DB_PREVIEW ?? cloudflareEnv.DB) as D1Database,
    blob: (cloudflareEnv.BLOB_PREVIEW ?? cloudflareEnv.BLOB) as R2Bucket,
    kv: (cloudflareEnv.KV_PREVIEW ?? cloudflareEnv.KV) as KVNamespace,
    cache: (cloudflareEnv.CACHE_PREVIEW ?? cloudflareEnv.CACHE) as KVNamespace,
    environment: 'preview',
    isLocal: false,
  }
}
