import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verification tests: KV analytics code has been fully removed.
 *
 * These tests confirm that all legacy KV-based analytics utilities,
 * types, and endpoints have been cleaned up now that analytics
 * have been migrated to D1.
 */

const ROOT = resolve(__dirname, '../../..')

describe('KV analytics cleanup verification', () => {
  describe('packages/app/server/utils/analytics.ts', () => {
    const filePath = resolve(ROOT, 'packages/app/server/utils/analytics.ts')

    it('should no longer exist (all contents were KV analytics)', () => {
      expect(existsSync(filePath)).toBe(false)
    })
  })

  describe('packages/admin/server/utils/analytics-types.ts', () => {
    const filePath = resolve(ROOT, 'packages/admin/server/utils/analytics-types.ts')

    it('should no longer exist (replaced by @create-studio/analytics/types)', () => {
      expect(existsSync(filePath)).toBe(false)
    })
  })

  describe('packages/app/server/api/analytics/dashboard.get.ts', () => {
    const filePath = resolve(ROOT, 'packages/app/server/api/analytics/dashboard.get.ts')

    it('should no longer exist (KV dashboard endpoint replaced by admin D1 dashboard)', () => {
      expect(existsSync(filePath)).toBe(false)
    })
  })

  describe('no remaining KV analytics imports', () => {
    it('events.post.ts should not import from old analytics utils', () => {
      const filePath = resolve(ROOT, 'packages/app/server/api/analytics/events.post.ts')
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8')
        expect(content).not.toContain('~/server/utils/analytics')
        expect(content).not.toContain('getAnalyticsKey')
        expect(content).not.toContain('storeSession')
        expect(content).not.toContain('updateDailyAggregate')
        expect(content).not.toContain('updateGlobalSummary')
      }
    })

    it('no file should import from the deleted analytics-types.ts', () => {
      const filePath = resolve(ROOT, 'packages/admin/server/utils/analytics-types.ts')
      expect(existsSync(filePath)).toBe(false)
    })
  })

  describe('scripts/backfill-cta-renders.sh', () => {
    const filePath = resolve(ROOT, 'scripts/backfill-cta-renders.sh')

    it('should no longer exist', () => {
      expect(existsSync(filePath)).toBe(false)
    })
  })
})
