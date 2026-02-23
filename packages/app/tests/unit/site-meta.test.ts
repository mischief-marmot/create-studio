import { describe, it, expect } from 'vitest'
import type { SiteSettings, VersionLogEntry } from '../../server/db/schema'

/**
 * Test suite for SiteMeta types and data validation
 * Tests the SiteSettings and VersionLogEntry interfaces
 */

describe('SiteMeta Types', () => {
  describe('SiteSettings', () => {
    it('should accept empty settings object', () => {
      const settings: SiteSettings = {}
      expect(settings).toEqual({})
    })

    it('should accept interactive_mode_enabled', () => {
      const settings: SiteSettings = { interactive_mode_enabled: true }
      expect(settings.interactive_mode_enabled).toBe(true)
    })

    it('should accept interactive_mode_button_text', () => {
      const settings: SiteSettings = { interactive_mode_button_text: 'Try it!' }
      expect(settings.interactive_mode_button_text).toBe('Try it!')
    })

    it('should accept null interactive_mode_button_text', () => {
      const settings: SiteSettings = { interactive_mode_button_text: null }
      expect(settings.interactive_mode_button_text).toBeNull()
    })

    it('should accept all settings together', () => {
      const settings: SiteSettings = {
        interactive_mode_enabled: false,
        interactive_mode_button_text: 'Custom Text',
      }
      expect(settings.interactive_mode_enabled).toBe(false)
      expect(settings.interactive_mode_button_text).toBe('Custom Text')
    })
  })

  describe('VersionLogEntry', () => {
    it('should have required fields', () => {
      const entry: VersionLogEntry = {
        from: '1.0.0',
        to: '1.1.0',
        at: '2026-02-23T12:00:00.000Z',
      }
      expect(entry.from).toBe('1.0.0')
      expect(entry.to).toBe('1.1.0')
      expect(entry.at).toBe('2026-02-23T12:00:00.000Z')
    })

    it('should work as an array of entries', () => {
      const logs: VersionLogEntry[] = [
        { from: '1.0.0', to: '1.1.0', at: '2026-01-01T00:00:00.000Z' },
        { from: '1.1.0', to: '1.2.0', at: '2026-02-01T00:00:00.000Z' },
      ]
      expect(logs).toHaveLength(2)
      expect(logs[0].from).toBe('1.0.0')
      expect(logs[1].to).toBe('1.2.0')
    })
  })

  describe('Settings merge behavior', () => {
    it('should merge partial settings into existing', () => {
      const existing: SiteSettings = {
        interactive_mode_enabled: true,
        interactive_mode_button_text: 'Old Text',
      }
      const update: Partial<SiteSettings> = {
        interactive_mode_button_text: 'New Text',
      }
      const merged = { ...existing, ...update }
      expect(merged.interactive_mode_enabled).toBe(true)
      expect(merged.interactive_mode_button_text).toBe('New Text')
    })

    it('should allow overwriting with undefined values via explicit spread', () => {
      const existing: SiteSettings = {
        interactive_mode_enabled: true,
      }
      const update: Partial<SiteSettings> = {
        interactive_mode_enabled: false,
      }
      const merged = { ...existing, ...update }
      expect(merged.interactive_mode_enabled).toBe(false)
    })
  })

  describe('Version log append behavior', () => {
    it('should append new entry to existing logs', () => {
      const existingLogs: VersionLogEntry[] = [
        { from: '1.0.0', to: '1.1.0', at: '2026-01-01T00:00:00.000Z' },
      ]
      const newEntry: VersionLogEntry = {
        from: '1.1.0',
        to: '1.2.0',
        at: '2026-02-01T00:00:00.000Z',
      }
      const updated = [...existingLogs, newEntry]
      expect(updated).toHaveLength(2)
      expect(updated[1].from).toBe('1.1.0')
    })

    it('should handle empty existing logs', () => {
      const existingLogs: VersionLogEntry[] = []
      const newEntry: VersionLogEntry = {
        from: '1.0.0',
        to: '1.1.0',
        at: '2026-01-01T00:00:00.000Z',
      }
      const updated = [...existingLogs, newEntry]
      expect(updated).toHaveLength(1)
    })
  })
})
