import { describe, it, expect } from 'vitest'
import { convertBatch } from '../../utils/unitConversion'
import type { BatchConversionRequest } from '../../utils/unitConversion'

describe('unitConversion', () => {
  describe('convertBatch - US to Metric', () => {
    it('converts cups to mL', () => {
      const request: BatchConversionRequest = {
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'cup' }],
      }
      const result = convertBatch(request)
      expect(result.target_system).toBe('metric')
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(236.6, 0)
    })

    it('converts tbsp to mL', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '2', unit: 'tbsp' }],
      })
      expect(result.conversions[0].unit).toBe('mL')
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(29.6, 0)
    })

    it('converts oz to g', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '8', unit: 'oz' }],
      })
      expect(result.conversions[0].unit).toBe('g')
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(226.8, 0)
    })

    it('converts lbs to g', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '2', unit: 'lbs' }],
      })
      expect(result.conversions[0].unit).toBe('g')
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(907.2, 0)
    })

    it('upgrades large mL to L', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '5', unit: 'cups' }],
      })
      expect(result.conversions[0].unit).toBe('L')
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(1.18, 1)
    })

    it('upgrades large g to kg', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '40', unit: 'oz' }],
      })
      expect(result.conversions[0].unit).toBe('kg')
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(1.13, 1)
    })
  })

  describe('convertBatch - Metric to US', () => {
    it('converts mL to cups', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '237', unit: 'mL' }],
      })
      expect(result.target_system).toBe('us_customary')
      expect(result.conversions[0].unit).toBe('cups')
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(1, 0)
    })

    it('converts g to oz', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '100', unit: 'g' }],
      })
      expect(result.conversions[0].unit).toBe('oz')
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(3.5, 0)
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
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(118.3, 0)
    })

    it('handles mixed numbers', () => {
      const result = convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1 1/2', unit: 'cup' }],
      })
      expect(parseFloat(result.conversions[0].amount!)).toBeCloseTo(354.9, 0)
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
      expect(result.conversions[0].max_amount).not.toBeNull()
      expect(parseFloat(result.conversions[0].max_amount!)).toBeCloseTo(473.2, 0)
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
