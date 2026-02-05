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
  /** Main app database (for managing sites/users) */
  db: D1Database
  /** Admin operations database (for admin sessions, audit logs, etc.) */
  adminDb: D1Database | null
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
 * In dev mode (local or --remote), we use NuxtHub's auto-imported db and only support
 * the default environment. Multi-environment switching only works when deployed to
 * Cloudflare Workers where we have direct access to both DB and DB_PREVIEW bindings.
 *
 * @param event - H3 event from the request
 * @returns Admin environment bindings with db, blob, kv, cache, and metadata
 */
export function useAdminEnv(event: H3Event): AdminEnvBindings {
  const environment = getAdminEnvironment(event)
  const cloudflareEnv = event.context.cloudflare?.env as Record<string, unknown> | undefined

  // Check if we're in development mode
  // In dev mode, use NuxtHub's hubDatabase() which handles local/remote connections
  const isDev = import.meta.dev

  // Handle dev mode (local or --remote) - use NuxtHub's hubDatabase() mechanism
  if (isDev) {
    return {
      db: undefined as unknown as D1Database,
      adminDb: null, // Admin DB not available in local dev (uses hubDatabase instead)
      blob: undefined as unknown as R2Bucket,
      kv: undefined as unknown as KVNamespace,
      cache: undefined as unknown as KVNamespace,
      environment: 'production', // Only production available in dev
      isLocal: true,
    }
  }

  // In production, check if we have direct Cloudflare bindings
  const hasCloudflareBindings = cloudflareEnv && cloudflareEnv.DB

  // Fallback if no bindings available (shouldn't happen in production)
  if (!hasCloudflareBindings) {
    return {
      db: undefined as unknown as D1Database,
      adminDb: null,
      blob: undefined as unknown as R2Bucket,
      kv: undefined as unknown as KVNamespace,
      cache: undefined as unknown as KVNamespace,
      environment: 'production',
      isLocal: true, // Treat as local if no bindings
    }
  }

  // For production environment, use the standard bindings
  if (environment === 'production') {
    return {
      db: cloudflareEnv.DB as D1Database,
      adminDb: (cloudflareEnv.DB_ADMIN as D1Database) ?? null,
      blob: cloudflareEnv.BLOB as R2Bucket,
      kv: cloudflareEnv.KV as KVNamespace,
      cache: cloudflareEnv.CACHE as KVNamespace,
      environment: 'production',
      isLocal: false,
    }
  }

  // For preview environment, use preview bindings with fallback to production
  // Preview bindings may not always be available, so we fall back gracefully
  // Note: Admin DB is shared across environments (no preview version)
  return {
    db: (cloudflareEnv.DB_PREVIEW ?? cloudflareEnv.DB) as D1Database,
    adminDb: (cloudflareEnv.DB_ADMIN as D1Database) ?? null,
    blob: (cloudflareEnv.BLOB_PREVIEW ?? cloudflareEnv.BLOB) as R2Bucket,
    kv: (cloudflareEnv.KV_PREVIEW ?? cloudflareEnv.KV) as KVNamespace,
    cache: (cloudflareEnv.CACHE_PREVIEW ?? cloudflareEnv.CACHE) as KVNamespace,
    environment: 'preview',
    isLocal: false,
  }
}
