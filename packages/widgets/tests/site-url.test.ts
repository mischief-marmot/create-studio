import { describe, it, expect } from 'vitest'
import { resolveSiteUrl } from '../src/lib/site-url'

describe('resolveSiteUrl', () => {
  it('prefers the explicit URL over the domain reconstruction', () => {
    expect(resolveSiteUrl(
      'https://www.slimmingeats.com/blog',
      'slimmingeats.com',
      'https:',
    )).toBe('https://www.slimmingeats.com/blog')
  })

  it('preserves an explicit URL even when the protocol differs from the parent page', () => {
    expect(resolveSiteUrl(
      'https://www.slimmingeats.com/blog',
      'slimmingeats.com',
      'http:',
    )).toBe('https://www.slimmingeats.com/blog')
  })

  it('falls back to the WP plugin docker stack port for localhost', () => {
    expect(resolveSiteUrl(undefined, 'localhost', 'https:')).toBe('http://localhost:8074')
  })

  it('uses http for .test domains (no SSL on local dev)', () => {
    expect(resolveSiteUrl(undefined, 'create.test', 'https:')).toBe('http://create.test')
  })

  it('uses the parent-page protocol for production domains', () => {
    expect(resolveSiteUrl(undefined, 'example.com', 'https:')).toBe('https://example.com')
    expect(resolveSiteUrl(undefined, 'example.com', 'http:')).toBe('http://example.com')
  })

  it('defaults to https when no protocol is provided (SSR)', () => {
    expect(resolveSiteUrl(undefined, 'example.com', undefined)).toBe('https://example.com')
  })

  it('treats an empty explicit URL as absent (falls through to domain logic)', () => {
    // ConfigManager guards against promoting an empty siteUrl, but this
    // pins the contract for any future caller that passes one through.
    expect(resolveSiteUrl('', 'example.com', 'https:')).toBe('https://example.com')
    expect(resolveSiteUrl('', 'localhost', 'https:')).toBe('http://localhost:8074')
  })
})
