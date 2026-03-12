import { describe, it, expect, vi } from 'vitest'
import { resolveDomainToSiteId } from '../../rollup/resolve-sites'

/**
 * Tests for resolveDomainToSiteId — resolves domain strings to site IDs
 * by querying the main database's Sites table.
 *
 * Uses a mock DB that returns predictable rows.
 */

function createMockMainDb(rows: Array<{ id: number; url: string | null; canonical_site_id: number | null }>) {
  // Build a chainable mock that resolves to the given rows
  const chain: Record<string, any> = {}
  const methods = ['select', 'from', 'where']
  for (const method of methods) {
    chain[method] = vi.fn(() => chain)
  }
  // Make the chain thenable
  chain.then = (resolve: (v: any) => any) => resolve(rows)

  const db = {
    select: vi.fn(() => chain),
    _chain: chain,
  }

  return db as any
}

describe('resolveDomainToSiteId', () => {
  it('should return an empty map when given an empty list of domains', async () => {
    const db = createMockMainDb([])
    const result = await resolveDomainToSiteId(db, [])
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('should map domains to their site IDs', async () => {
    const db = createMockMainDb([
      { id: 1, url: 'example.com', canonical_site_id: null },
      { id: 2, url: 'blog.test', canonical_site_id: null },
    ])

    const result = await resolveDomainToSiteId(db, ['example.com', 'blog.test'])

    expect(result.get('example.com')).toBe(1)
    expect(result.get('blog.test')).toBe(2)
  })

  it('should resolve canonical_site_id when set (alias sites)', async () => {
    // Site 3 is an alias pointing to site 1 as its canonical
    const db = createMockMainDb([
      { id: 3, url: 'alias.example.com', canonical_site_id: 1 },
    ])

    const result = await resolveDomainToSiteId(db, ['alias.example.com'])

    // Should resolve to the canonical site ID, not the alias site ID
    expect(result.get('alias.example.com')).toBe(1)
  })

  it('should return no mapping for unknown domains', async () => {
    const db = createMockMainDb([])

    const result = await resolveDomainToSiteId(db, ['unknown.domain.com'])

    expect(result.has('unknown.domain.com')).toBe(false)
    expect(result.size).toBe(0)
  })

  it('should handle a mix of known and unknown domains', async () => {
    const db = createMockMainDb([
      { id: 5, url: 'known.com', canonical_site_id: null },
    ])

    const result = await resolveDomainToSiteId(db, ['known.com', 'unknown.com'])

    expect(result.get('known.com')).toBe(5)
    expect(result.has('unknown.com')).toBe(false)
  })

  it('should handle deduplication — multiple aliases pointing to the same canonical', async () => {
    const db = createMockMainDb([
      { id: 10, url: 'www.example.com', canonical_site_id: 1 },
      { id: 11, url: 'example.com', canonical_site_id: null },
    ])

    // Both should map but www.example.com resolves to canonical 1, example.com resolves to its own id 11
    // Wait — example.com has id: 11 and no canonical, so it maps to 11
    // www.example.com has canonical_site_id: 1, so it maps to 1
    const result = await resolveDomainToSiteId(db, ['www.example.com', 'example.com'])

    expect(result.get('www.example.com')).toBe(1)
    expect(result.get('example.com')).toBe(11)
  })

  it('should skip sites with null url', async () => {
    const db = createMockMainDb([
      { id: 1, url: null, canonical_site_id: null },
    ])

    const result = await resolveDomainToSiteId(db, ['something.com'])

    expect(result.size).toBe(0)
  })
})
