import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit Conversion Tests
 *
 * Tests both the generic unit conversion and the new ingredient-specific
 * density-based conversion using USDA reference data.
 */

// Mock the ingredientDensity module before importing unitConversion
vi.mock('../../server/utils/ingredientDensity', () => {
  const densityData: Record<string, { grams_per_unit: number; unit: string; is_liquid: boolean } | null> = {
    // Flours
    'bread flour:cup_grams': { grams_per_unit: 137, unit: 'g', is_liquid: false },
    'all-purpose flour:cup_grams': { grams_per_unit: 125, unit: 'g', is_liquid: false },
    'flour:cup_grams': { grams_per_unit: 125, unit: 'g', is_liquid: false },
    'cake flour:cup_grams': { grams_per_unit: 114, unit: 'g', is_liquid: false },
    'whole wheat flour:cup_grams': { grams_per_unit: 120, unit: 'g', is_liquid: false },

    // Sugars
    'sugar:cup_grams': { grams_per_unit: 200, unit: 'g', is_liquid: false },
    'brown sugar:cup_grams': { grams_per_unit: 220, unit: 'g', is_liquid: false },
    'powdered sugar:cup_grams': { grams_per_unit: 120, unit: 'g', is_liquid: false },

    // Fats
    'butter:cup_grams': { grams_per_unit: 227, unit: 'g', is_liquid: false },
    'butter:tbsp_grams': { grams_per_unit: 14.2, unit: 'g', is_liquid: false },
    'butter:tsp_grams': { grams_per_unit: 4.7, unit: 'g', is_liquid: false },

    // Liquids (density lookup returns is_liquid: true)
    'water:cup_grams': { grams_per_unit: 237, unit: 'g', is_liquid: true },
    'milk:cup_grams': { grams_per_unit: 244, unit: 'g', is_liquid: true },
    'olive oil:cup_grams': { grams_per_unit: 216, unit: 'g', is_liquid: true },
    'honey:cup_grams': { grams_per_unit: 339, unit: 'g', is_liquid: true },

    // Other
    'cocoa powder:cup_grams': { grams_per_unit: 86, unit: 'g', is_liquid: false },
    'oats:cup_grams': { grams_per_unit: 81, unit: 'g', is_liquid: false },
    'rice:cup_grams': { grams_per_unit: 185, unit: 'g', is_liquid: false },
    'salt:tsp_grams': { grams_per_unit: 6.1, unit: 'g', is_liquid: false },
  }

  // Map unit aliases to column names (same logic as ingredientDensity.ts)
  const unitToColumn: Record<string, string> = {
    cup: 'cup_grams', cups: 'cup_grams', c: 'cup_grams',
    tbsp: 'tbsp_grams', tablespoon: 'tbsp_grams', tablespoons: 'tbsp_grams',
    tsp: 'tsp_grams', teaspoon: 'tsp_grams', teaspoons: 'tsp_grams',
  }

  return {
    lookupDensity: vi.fn(async (ingredientName: string, sourceUnit: string) => {
      const unitLower = sourceUnit.toLowerCase().trim()
      const column = unitToColumn[unitLower]
      if (!column) return null

      const key = `${ingredientName.toLowerCase().trim()}:${column}`
      return densityData[key] ?? null
    }),
    clearDensityCache: vi.fn(),
  }
})

// Import after mocking
const { convertBatch } = await import('../../server/utils/unitConversion')
type BatchConversionRequest = import('../../server/utils/unitConversion').BatchConversionRequest

// --- Helper ---
function makeBatchRequest(
  ingredients: Array<{ id?: number; amount: string; unit: string; item?: string; max_amount?: string | null }>,
  source_system: 'us_customary' | 'metric' = 'us_customary',
): BatchConversionRequest {
  return {
    creation_id: 1,
    source_system,
    ingredients: ingredients.map((ing, i) => ({
      id: ing.id ?? i + 1,
      amount: ing.amount,
      unit: ing.unit,
      max_amount: ing.max_amount ?? null,
      item: ing.item,
    })),
  }
}

describe('Unit Conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Generic conversion (no item / fallback)', () => {
    it('should convert cups to mL without item', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '235',  // 236.588 → nearest 5 = 235
        unit: 'mL',
      })
    })

    it('should convert tbsp to mL without item', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '2', unit: 'tbsp' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '30',
        unit: 'mL',
      })
    })

    it('should convert oz to g', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '8', unit: 'oz' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '225',
        unit: 'g',
      })
    })

    it('should convert lbs to g', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '2', unit: 'lbs' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '905',  // 907.184 → nearest 5 = 905
        unit: 'g',
      })
    })

    it('should handle empty item string as generic conversion', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: '' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '235',  // 236.588 → nearest 5 = 235
        unit: 'mL',
      })
    })

    it('should handle unconvertible units', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '3', unit: 'cloves' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: false,
        amount: null,
        unit: null,
      })
    })

    it('should handle fractional amounts', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1/2', unit: 'cup' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '120',  // 118.294 → nearest 5 = 120
        unit: 'mL',
      })
    })

    it('should handle mixed number amounts', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1 1/2', unit: 'cups' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '355',
        unit: 'mL',
      })
    })

    it('should handle range amounts (max_amount)', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', max_amount: '2' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '235',  // 236.588 → nearest 5 = 235
        unit: 'mL',
        max_amount: '475',  // 473.176 → nearest 5 = 475
      })
    })

    it('should upgrade mL to L when >= 1000', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '5', unit: 'quarts' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        unit: 'L',
      })
    })
  })

  describe('Density-based conversion (dry ingredients)', () => {
    it('should convert bread flour cups to grams', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '3.5', unit: 'cups', item: 'bread flour' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '480',  // 3.5 × 137 = 479.5 → 480
        unit: 'g',
      })
    })

    it('should convert all-purpose flour cups to grams', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '2', unit: 'cups', item: 'all-purpose flour' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '250',  // 2 × 125 = 250
        unit: 'g',
      })
    })

    it('should convert sugar cups to grams', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'sugar' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '200',  // 1 × 200
        unit: 'g',
      })
    })

    it('should convert butter cups to grams', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'butter' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '225',  // 227 → nearest 5 = 225
        unit: 'g',
      })
    })

    it('should convert butter tbsp to grams', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '2', unit: 'tbsp', item: 'butter' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '30',  // 2 × 14.2 = 28.4 → nearest 5 = 30
        unit: 'g',
      })
    })

    it('should convert cocoa powder cups to grams', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1/2', unit: 'cup', item: 'cocoa powder' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '45',  // 0.5 × 86 = 43 → nearest 5 = 45
        unit: 'g',
      })
    })

    it('should handle density conversion with max_amount range', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'flour', max_amount: '2' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '125',
        unit: 'g',
        max_amount: '250',
      })
    })

    it('should upgrade g to kg when >= 1000', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '8', unit: 'cups', item: 'sugar' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '2',  // 8 × 200 = 1600g = 1.6kg → nearest integer = 2
        unit: 'kg',
      })
    })

    it('should handle salt tsp to grams', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'tsp', item: 'salt' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '6',  // 6.1 → 6
        unit: 'g',
      })
    })
  })

  describe('Liquid fallback (density exists but is_liquid)', () => {
    it('should fall through to generic mL for water', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '2', unit: 'cups', item: 'water' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '475',  // generic: 2 × 236.588 = 473.176 → nearest 5 = 475
        unit: 'mL',
      })
    })

    it('should fall through to generic mL for milk', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'milk' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '235',  // generic: 236.588 → nearest 5 = 235
        unit: 'mL',
      })
    })

    it('should fall through to generic mL for olive oil', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'olive oil' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '235',  // generic: 236.588 → nearest 5 = 235
        unit: 'mL',
      })
    })
  })

  describe('Unknown ingredient fallback', () => {
    it('should fall through to generic conversion for unknown ingredients', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'dragon fruit crystals' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '235',  // generic: 236.588 → nearest 5 = 235
        unit: 'mL',
      })
    })
  })

  describe('Metric → US conversion (unaffected by density)', () => {
    it('should convert grams to oz', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '100', unit: 'g', item: 'flour' },
      ], 'metric'))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        unit: 'oz',
      })
    })

    it('should convert mL to cups', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '500', unit: 'mL' },
      ], 'metric'))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '2',
        unit: 'cups',
      })
    })
  })

  describe('Inline conversion extraction', () => {
    it('should use inline grams from item text', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1 1/4', unit: 'cups', item: '(156 grams) self-rising flour' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '156',
        unit: 'g',
      })
    })

    it('should use inline grams with "g" abbreviation', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '3', unit: 'cups', item: 'bread flour (420 g)' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '420',
        unit: 'g',
      })
    })

    it('should use inline grams with "gram" singular', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1/4', unit: 'cup', item: 'sugar (50 grams)' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '50',
        unit: 'g',
      })
    })

    it('should handle inline range "X to Y unit"', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'lukewarm water (170 to 227 grams)' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '170',
        unit: 'g',
        max_amount: '227',
      })
    })

    it('should handle inline range "X unit to Y unit"', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'water (170 grams to 227 grams)' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '170',
        unit: 'g',
        max_amount: '227',
      })
    })

    it('should handle inline mL', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'milk (240 mL)' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '240',
        unit: 'mL',
      })
    })

    it('should handle inline kg', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '8', unit: 'cups', item: 'flour (1.2 kg)' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '1.2',
        unit: 'kg',
      })
    })

    it('should fall through to density when no inline conversion present', async () => {
      const result = await convertBatch(makeBatchRequest([
        { amount: '1', unit: 'cup', item: 'sugar' },
      ]))
      expect(result.conversions[0]).toMatchObject({
        convertible: true,
        amount: '200',
        unit: 'g',
      })
    })
  })

  describe('Mixed US/metric ingredient list (European-style)', () => {
    it('should handle a real-world mixed ingredient list', async () => {
      // Simulates a European recipe with mixed US volume + metric weight/volume
      // source_system = 'us_customary' — US units get converted, metric units are not convertible
      const result = await convertBatch(makeBatchRequest([
        { id: 1, amount: '6', unit: 'tbsp', item: 'extra virgin olive oil' },
        { id: 2, amount: '4', unit: 'tbsp', item: 'butter' },
        // "1 large onion" — no convertible unit, wouldn't be sent by plugin
        { id: 3, amount: '2.5', unit: 'tsp', item: 'fresh ginger, finely grated', max_amount: '3' },
        // "2 cloves garlic" — no convertible unit, wouldn't be sent by plugin
        { id: 4, amount: '1.800', unit: 'grams', item: 'pumpkin, peeled and cut into chunks' },
        { id: 5, amount: '300', unit: 'grams', item: 'carrots, peeled and cut into chunks' },
        { id: 6, amount: '300', unit: 'grams', item: 'sweet potatoes, peeled and cubed' },
        { id: 7, amount: '2.5', unit: 'litres', item: 'vegetable stock or light chicken stock' },
        { id: 8, amount: '1', unit: 'tbsp', item: 'sea salt' },
        // "freshly ground pepper" and "pinch of nutmeg" — no convertible units
      ]))

      expect(result.target_system).toBe('metric')

      // Olive oil: liquid → generic mL (6 × 14.787 = 88.7 → nearest 5 = 90)
      expect(result.conversions[0]).toMatchObject({ id: 1, convertible: true, unit: 'mL', amount: '90' })

      // Butter: density → grams (4 × 14.2 = 56.8 → nearest 5 = 55)
      expect(result.conversions[1]).toMatchObject({ id: 2, convertible: true, unit: 'g', amount: '55' })

      // Ginger: no density match → generic mL (2.5 × 4.929 = 12.3 → nearest 5 = 10)
      expect(result.conversions[2]).toMatchObject({ id: 3, convertible: true, unit: 'mL' })
      // max_amount: 3 × 4.929 = 14.787 → nearest 5 = 15
      expect(result.conversions[2].max_amount).toBe('15')

      // Pumpkin: "grams" is NOT in US_TO_METRIC table → not convertible from us_customary
      expect(result.conversions[3]).toMatchObject({ id: 4, convertible: false })

      // Carrots: same — grams not convertible from us_customary
      expect(result.conversions[4]).toMatchObject({ id: 5, convertible: false })

      // Sweet potatoes: same
      expect(result.conversions[5]).toMatchObject({ id: 6, convertible: false })

      // Vegetable stock: "litres" not in US_TO_METRIC → not convertible
      expect(result.conversions[6]).toMatchObject({ id: 7, convertible: false })

      // Sea salt: no density match → generic mL (1 × 14.787 = 14.787 → nearest 5 = 15)
      expect(result.conversions[7]).toMatchObject({ id: 8, convertible: true, unit: 'mL', amount: '15' })
    })
  })

  describe('Batch processing', () => {
    it('should handle mixed batch with density and generic conversions', async () => {
      const result = await convertBatch(makeBatchRequest([
        { id: 1, amount: '2', unit: 'cups', item: 'flour' },
        { id: 2, amount: '1', unit: 'cup', item: 'milk' },
        { id: 3, amount: '3', unit: 'tbsp', item: 'butter' },
        { id: 4, amount: '1', unit: 'cup' },  // no item
        { id: 5, amount: '8', unit: 'oz' },    // weight conversion
      ]))

      expect(result.target_system).toBe('metric')
      expect(result.conversions).toHaveLength(5)

      // Flour: density → grams
      expect(result.conversions[0]).toMatchObject({ id: 1, unit: 'g', amount: '250' })
      // Milk: liquid → mL (generic)
      expect(result.conversions[1]).toMatchObject({ id: 2, unit: 'mL' })
      // Butter: density → grams
      expect(result.conversions[2]).toMatchObject({ id: 3, unit: 'g', amount: '45' }) // 3 × 14.2 = 42.6 → nearest 5 = 45
      // No item: generic → mL
      expect(result.conversions[3]).toMatchObject({ id: 4, unit: 'mL' })
      // Weight: generic → g
      expect(result.conversions[4]).toMatchObject({ id: 5, unit: 'g' })
    })
  })
})
