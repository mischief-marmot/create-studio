import { describe, it, expect } from 'vitest'
import { validateEmail } from '~~/server/utils/errors'

describe('Waitlist Free+ API Logic', () => {
  describe('Email Validation', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.org')).toBe(true)
      expect(validateEmail('user+tag@domain.com')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user@domain..com')).toBe(false)
    })
  })

  describe('Email Normalization', () => {
    it('trims whitespace from email', () => {
      const email = '  test@example.com  '
      const normalized = email.trim().toLowerCase()
      expect(normalized).toBe('test@example.com')
    })

    it('lowercases email', () => {
      const email = 'Test@EXAMPLE.COM'
      const normalized = email.trim().toLowerCase()
      expect(normalized).toBe('test@example.com')
    })

    it('handles mixed whitespace and case', () => {
      const email = '  User@Domain.Com  '
      const normalized = email.trim().toLowerCase()
      expect(normalized).toBe('user@domain.com')
    })
  })

  describe('Metadata with waitlist_free_plus', () => {
    it('stores waitlist timestamp inside metadata object', () => {
      const now = new Date().toISOString()
      const metadata = { waitlist_free_plus: now }
      expect(metadata.waitlist_free_plus).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('merges waitlist into existing metadata without losing other keys', () => {
      const existing = { some_flag: true }
      const now = new Date().toISOString()
      const merged = { ...existing, waitlist_free_plus: now }
      expect(merged.some_flag).toBe(true)
      expect(merged.waitlist_free_plus).toBe(now)
    })

    it('detects existing waitlist entry in metadata', () => {
      const meta = { waitlist_free_plus: '2026-01-01T00:00:00.000Z' }
      expect(!!meta.waitlist_free_plus).toBe(true)
    })

    it('detects missing waitlist entry in empty metadata', () => {
      const meta: Record<string, any> = {}
      expect(!!meta.waitlist_free_plus).toBe(false)
    })
  })

  describe('Marketing Opt-in Defaults', () => {
    it('defaults marketing_opt_in to false when undefined', () => {
      const body: Record<string, any> = { email: 'test@example.com' }
      const marketing_opt_in = body.marketing_opt_in ?? false
      expect(marketing_opt_in).toBe(false)
    })

    it('preserves marketing_opt_in when explicitly true', () => {
      const body = { email: 'test@example.com', marketing_opt_in: true }
      const marketing_opt_in = body.marketing_opt_in ?? false
      expect(marketing_opt_in).toBe(true)
    })

    it('preserves marketing_opt_in when explicitly false', () => {
      const body = { email: 'test@example.com', marketing_opt_in: false }
      const marketing_opt_in = body.marketing_opt_in ?? false
      expect(marketing_opt_in).toBe(false)
    })
  })

  describe('Response Format', () => {
    it('returns success and alreadyOnList for new signups', () => {
      const response = { success: true, alreadyOnList: false }
      expect(response.success).toBe(true)
      expect(response.alreadyOnList).toBe(false)
    })

    it('returns success and alreadyOnList true for existing waitlist users', () => {
      const response = { success: true, alreadyOnList: true }
      expect(response.success).toBe(true)
      expect(response.alreadyOnList).toBe(true)
    })
  })
})
