import { describe, it, expect } from 'vitest'
import { isOnStudioDomain } from '../../src/utils/domain'

describe('isOnStudioDomain', () => {
  it('matches when hostname equals the baseUrl hostname', () => {
    expect(isOnStudioDomain('https://create.studio', 'create.studio')).toBe(true)
  })

  it('matches across protocols and paths', () => {
    expect(isOnStudioDomain('http://create.studio/embed', 'create.studio')).toBe(true)
  })

  it('does not match when hostnames differ', () => {
    expect(isOnStudioDomain('https://create.studio', 'example.com')).toBe(false)
  })

  it('treats www and apex as distinct (exact hostname match)', () => {
    expect(isOnStudioDomain('https://create.studio', 'www.create.studio')).toBe(false)
  })

  it('returns false for empty or missing baseUrl', () => {
    expect(isOnStudioDomain('', 'create.studio')).toBe(false)
    expect(isOnStudioDomain(null, 'create.studio')).toBe(false)
    expect(isOnStudioDomain(undefined, 'create.studio')).toBe(false)
  })

  it('returns false for unparseable baseUrl', () => {
    expect(isOnStudioDomain('not a url', 'create.studio')).toBe(false)
  })

  it('returns false when hostname is empty', () => {
    expect(isOnStudioDomain('https://create.studio', '')).toBe(false)
  })

  it('supports localhost + port for dev', () => {
    expect(isOnStudioDomain('http://localhost:3000', 'localhost')).toBe(true)
  })
})
