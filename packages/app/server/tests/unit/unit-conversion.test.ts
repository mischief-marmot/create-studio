import { describe, it, expect, vi } from 'vitest'

// Mock ingredientDensity to return null for all lookups (these tests verify generic conversion)
vi.mock('../../utils/ingredientDensity', () => ({
  lookupDensity: vi.fn(async () => null),
  clearDensityCache: vi.fn(),
}))

const { convertBatch } = await import('../../utils/unitConversion')
type BatchConversionRequest = import('../../utils/unitConversion').BatchConversionRequest

describe('unitConversion', () => {
  describe('convertBatch - US to Metric', () => {
    it('converts cups to mL (rounded to nearest 5)', async () => {
      const request: BatchConversionRequest = {
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'cup' }],
      }
      const result = await convertBatch(request)
      expect(result.target_system).toBe('metric')
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
      // 236.588 → nearest 5 = 235
      expect(result.conversions[0].amount).toBe('235')
    })

    it('converts tbsp to mL (rounded to nearest 5)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '2', unit: 'tbsp' }],
      })
      expect(result.conversions[0].unit).toBe('mL')
      // 29.574 → nearest 5 = 30
      expect(result.conversions[0].amount).toBe('30')
    })

    it('converts oz to g (rounded to nearest 5)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '8', unit: 'oz' }],
      })
      expect(result.conversions[0].unit).toBe('g')
      // 226.796 → nearest 5 = 225
      expect(result.conversions[0].amount).toBe('225')
    })

    it('converts lbs to g (rounded to nearest 5)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '2', unit: 'lbs' }],
      })
      expect(result.conversions[0].unit).toBe('g')
      // 907.184 → nearest 5 = 905
      expect(result.conversions[0].amount).toBe('905')
    })

    it('upgrades large mL to L (rounded to nearest integer)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '5', unit: 'cups' }],
      })
      expect(result.conversions[0].unit).toBe('L')
      // 1182.94 mL → 1.183 L → nearest integer = 1
      expect(result.conversions[0].amount).toBe('1')
    })

    it('upgrades large g to kg (rounded to nearest integer)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '40', unit: 'oz' }],
      })
      expect(result.conversions[0].unit).toBe('kg')
      // 1133.98 g → 1.134 kg → nearest integer = 1
      expect(result.conversions[0].amount).toBe('1')
    })

    it('converts pints to mL', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'pint' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
      // 473.176 → nearest 5 = 475
      expect(result.conversions[0].amount).toBe('475')
    })

    it('converts quarts to mL', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'quart' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
      // 946.353 → nearest 5 = 945
      expect(result.conversions[0].amount).toBe('945')
    })

    it('converts gallons to L', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'gallon' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('L')
      // 3785.41 mL → 3.785 L → nearest integer = 4
      expect(result.conversions[0].amount).toBe('4')
    })

    it('converts butter sticks to g', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '2', unit: 'sticks' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('g')
      // 226.8 → nearest 5 = 225
      expect(result.conversions[0].amount).toBe('225')
    })
  })

  describe('US unit aliases', () => {
    it('converts tablespoon (full word)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'tablespoon' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
      // 14.787 → nearest 5 = 15
      expect(result.conversions[0].amount).toBe('15')
    })

    it('converts teaspoon (full word)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'teaspoon' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
      // 4.929 → round to 1 decimal = 5
      expect(result.conversions[0].amount).toBe('5')
    })

    it('converts ounces (full word)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '4', unit: 'ounces' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('g')
      // 113.398 → nearest 5 = 115
      expect(result.conversions[0].amount).toBe('115')
    })

    it('converts pounds (full word)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'pound' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('g')
      // 453.592 → nearest 5 = 455
      expect(result.conversions[0].amount).toBe('455')
    })

    it('converts pt abbreviation', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'pt' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
    })

    it('converts qt abbreviation', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'qt' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('mL')
    })

    it('converts gal abbreviation', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'gal' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('L')
    })
  })

  describe('convertBatch - Metric to US', () => {
    it('converts mL to cups (rounded to nearest integer)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '237', unit: 'mL' }],
      })
      expect(result.target_system).toBe('us_customary')
      expect(result.conversions[0].unit).toBe('cups')
      // 237 / 236.588 = 1.002 → nearest integer = 1
      expect(result.conversions[0].amount).toBe('1')
    })

    it('converts g to oz (rounded to nearest integer)', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '100', unit: 'g' }],
      })
      expect(result.conversions[0].unit).toBe('oz')
      // 100 / 28.3495 = 3.527 → nearest integer = 4
      expect(result.conversions[0].amount).toBe('4')
    })

    it('converts centiliters to cups', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '24', unit: 'cl' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('cups')
      // 240 mL / 236.588 = 1.014 → nearest integer = 1
      expect(result.conversions[0].amount).toBe('1')
    })

    it('converts deciliters to cups', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '5', unit: 'dl' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('cups')
      // 500 mL / 236.588 = 2.113 → nearest integer = 2
      expect(result.conversions[0].amount).toBe('2')
    })

    it('converts liters (full word) to cups', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '1', unit: 'liter' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('cups')
      // 1000 / 236.588 = 4.227 → nearest integer = 4
      expect(result.conversions[0].amount).toBe('4')
    })

    it('converts litres (British spelling) to cups', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '1', unit: 'litre' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('cups')
    })

    it('converts grams (full word) to oz', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '50', unit: 'grams' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('oz')
      // 50 / 28.3495 = 1.764 → nearest integer = 2
      expect(result.conversions[0].amount).toBe('2')
    })

    it('converts kilograms (full word) to lbs', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'metric',
        ingredients: [{ id: 1, amount: '1', unit: 'kilogram' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      expect(result.conversions[0].unit).toBe('lbs')
      // 1000 / 28.3495 = 35.27 oz → 2.2 lbs → nearest integer = 2
      expect(result.conversions[0].amount).toBe('2')
    })
  })

  describe('fractional amounts', () => {
    it('handles simple fractions', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1/2', unit: 'cup' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      // 118.294 → nearest 5 = 120
      expect(result.conversions[0].amount).toBe('120')
    })

    it('handles mixed numbers', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1 1/2', unit: 'cup' }],
      })
      // 354.882 → nearest 5 = 355
      expect(result.conversions[0].amount).toBe('355')
    })
  })

  describe('max_amount (ranges)', () => {
    it('converts max_amount alongside amount', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'cup', max_amount: '2' }],
      })
      expect(result.conversions[0].convertible).toBe(true)
      // max: 473.176 → nearest 5 = 475
      expect(result.conversions[0].max_amount).toBe('475')
    })

    it('returns null max_amount when not provided', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '1', unit: 'cup' }],
      })
      expect(result.conversions[0].max_amount).toBeNull()
    })
  })

  describe('non-convertible inputs', () => {
    it('marks unknown units as non-convertible', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: '3', unit: 'cloves' }],
      })
      expect(result.conversions[0].convertible).toBe(false)
      expect(result.conversions[0].amount).toBeNull()
    })

    it('marks unparseable amounts as non-convertible', async () => {
      const result = await convertBatch({
        creation_id: 1,
        source_system: 'us_customary',
        ingredients: [{ id: 1, amount: 'a few', unit: 'cups' }],
      })
      expect(result.conversions[0].convertible).toBe(false)
    })
  })

  describe('batch processing', () => {
    it('converts multiple ingredients', async () => {
      const result = await convertBatch({
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
