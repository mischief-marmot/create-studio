import { describe, it, expect } from 'vitest'
import { convertBatch } from '../../utils/unitConversion'
import type { BatchConversionRequest } from '../../utils/unitConversion'

describe('unitConversion', () => {
  describe('convertBatch - US to Metric', () => {
    it('converts cups to mL (rounded to nearest 5)', () => {
      const request: BatchConversionRequest = {
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'cup' }],
      }
      const result = convertBatch(request)
      expect(result.target_system).toBe('metric')
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
      // 236.588 → nearest 5 = 235
      expect(result.conversions[0].amount).toBe('235')
    })

    it('converts tbsp to mL (rounded to nearest 5)', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '2', unit: 'tbsp' }],
      })
      expect(result.conversions[0].unit).toBe('mL')
      // 29.574 → nearest 5 = 30
      expect(result.conversions[0].amount).toBe('30')
    })

    it('converts oz to g (rounded to nearest 5)', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '8', unit: 'oz' }],
      })
      expect(result.conversions[0].unit).toBe('g')
      // 226.796 → nearest 5 = 225
      expect(result.conversions[0].amount).toBe('225')
    })

    it('converts lbs to g (rounded to nearest 5)', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '2', unit: 'lbs' }],
      })
      expect(result.conversions[0].unit).toBe('g')
      // 907.184 → nearest 5 = 905
      expect(result.conversions[0].amount).toBe('905')
    })

    it('upgrades large mL to L (rounded to nearest integer)', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '5', unit: 'cups' }],
      })
      expect(result.conversions[0].unit).toBe('L')
      // 1182.94 mL → 1.183 L → nearest integer = 1
      expect(result.conversions[0].amount).toBe('1')
    })

    it('upgrades large g to kg (rounded to nearest integer)', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '40', unit: 'oz' }],
      })
      expect(result.conversions[0].unit).toBe('kg')
      // 1133.98 g → 1.134 kg → nearest integer = 1
      expect(result.conversions[0].amount).toBe('1')
    })
  })

  describe('convertBatch - Metric to US', () => {
    it('converts mL to cups (rounded to nearest integer)', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '237', unit: 'mL' }],
      })
      expect(result.target_system).toBe('us_customary')
      expect(result.conversions[0].unit).toBe('cups')
      // 237 / 236.588 = 1.002 → nearest integer = 1
      expect(result.conversions[0].amount).toBe('1')
    })

    it('converts g to oz (rounded to nearest integer)', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '100', unit: 'g' }],
      })
      expect(result.conversions[0].unit).toBe('oz')
      // 100 / 28.3495 = 3.527 → nearest integer = 4
      expect(result.conversions[0].amount).toBe('4')
    })
  })

  describe('fractional amounts', () => {
    it('handles simple fractions', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1/2', unit: 'cup' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      // 118.294 → nearest 5 = 120
      expect(result.conversions[0].amount).toBe('120')
    })

    it('handles mixed numbers', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1 1/2', unit: 'cup' }],
      })
      // 354.882 → nearest 5 = 355
      expect(result.conversions[0].amount).toBe('355')
    })
  })

  describe('max_amount (ranges)', () => {
    it('converts max_amount alongside amount', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'cup', max_amount: '2' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      // max: 473.176 → nearest 5 = 475
      expect(result.conversions[0].max_amount).toBe('475')
    })

    it('returns null max_amount when not provided', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'cup' }],
      })
      expect(result.conversions[0].max_amount).toBeNull()
    })
  })

  describe('non-convertible inputs', () => {
    it('marks unknown units as non-convertible', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '3', unit: 'cloves' }],
      })
      expect(result.conversions[0].convertible).toBe(false)
      expect(result.conversions[0].amount).toBeNull()
    })

    it('marks unparseable amounts as non-convertible', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: 'a few', unit: 'cups' }],
      })
      expect(result.conversions[0].convertible).toBe(false)
    })
  })

  describe('batch processing', () => {
    it('converts multiple ingredients', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [
          { id: 1, amount: '2', unit: 'cups' },
          { id: 2, amount: '1', unit: 'tbsp' },
          { id: 3, amount: '3', unit: 'cloves' },
        ],
      })
      expect(result.conversions).toHaveLength(3)
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[1].convertible).toBe(true)
      expect(result.conversions[2].convertible).toBe(false)
    })
  })
})
