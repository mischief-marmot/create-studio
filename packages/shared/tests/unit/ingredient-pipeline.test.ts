import { describe, it, expect } from 'vitest'
import {
  transformIngredient,
  transformIngredientValue,
  calculateAdjustedAmount,
  adjustFraction,
  decimalToFraction,
  formatNumber,
  extractAmount
} from '../../src/utils/ingredient-pipeline'
import type { UnitConversionConfig } from '../../src/utils/unit-conversion'

// ─── Test data ──────────────────────────────────────────────────────────────

const unitConfig: UnitConversionConfig = {
  enabled: true,
  default_system: 'auto',
  source_system: 'us_customary',
  label: 'Unit Conversion',
  conversions: {
    'ing-1': { amount: '240', unit: 'mL' },
    'ing-2': { amount: '15', unit: 'mL' },
    'ing-3': { amount: '450', unit: 'g' },
  }
}

// ─── transformIngredient ────────────────────────────────────────────────────

describe('transformIngredient', () => {
  it('returns original text when no transformations active', () => {
    expect(transformIngredient('1 cup flour', null, null, null, 1)).toBe('1 cup flour')
  })

  it('applies servings multiplier only (no unit conversion)', () => {
    const result = transformIngredient('2 cups flour', null, null, null, 2)
    expect(result).toBe('4 cups flour')
  })

  it('applies unit conversion only (no servings change)', () => {
    const result = transformIngredient('1 cup milk', 'ing-1', unitConfig, 'metric', 1)
    expect(result).toBe('240 mL milk')
  })

  it('applies both unit conversion then servings multiplier', () => {
    // Unit conversion first: "1 cup milk" → "240 mL milk"
    // Then servings: "240 mL milk" → "480 mL milk"
    const result = transformIngredient('1 cup milk', 'ing-1', unitConfig, 'metric', 2)
    expect(result).toBe('480 mL milk')
  })

  it('skips unit conversion when target system matches source system', () => {
    const result = transformIngredient('1 cup flour', 'ing-1', unitConfig, 'us_customary', 2)
    expect(result).toBe('2 cup flour')
  })

  it('skips unit conversion when ingredientId has no conversion entry', () => {
    const result = transformIngredient('1 pinch salt', 'unknown-id', unitConfig, 'metric', 2)
    expect(result).toBe('2 pinch salt')
  })

  it('handles fractions with servings multiplier', () => {
    const result = transformIngredient('1/2 tsp vanilla', null, null, null, 2)
    expect(result).toBe('1 tsp vanilla')
  })

  it('handles mixed fractions with servings multiplier', () => {
    const result = transformIngredient('1 1/2 cups water', null, null, null, 2)
    expect(result).toBe('3 cups water')
  })

  it('returns original text when ingredient has no numeric amount', () => {
    expect(transformIngredient('salt to taste', null, null, null, 2)).toBe('salt to taste')
  })

  // Full unit word matching
  it('applies unit conversion with full word "tablespoons"', () => {
    const result = transformIngredient('2 tablespoons olive oil', 'ing-2', unitConfig, 'metric', 1)
    expect(result).toBe('15 mL olive oil')
  })

  it('applies unit conversion with singular "tablespoon"', () => {
    const result = transformIngredient('1 tablespoon butter', 'ing-2', unitConfig, 'metric', 1)
    expect(result).toBe('15 mL butter')
  })

  it('applies unit conversion with full word "cup"', () => {
    const result = transformIngredient('1 cup milk', 'ing-1', unitConfig, 'metric', 1)
    expect(result).toBe('240 mL milk')
  })

  it('applies unit conversion with full word "ounces"', () => {
    const config: UnitConversionConfig = {
      ...unitConfig,
      conversions: { 'ing-oz': { amount: '450', unit: 'g' } }
    }
    const result = transformIngredient('16 ounces ground beef', 'ing-oz', config, 'metric', 1)
    expect(result).toBe('450 g ground beef')
  })

  it('applies unit conversion with full word "pound"', () => {
    const result = transformIngredient('1 pound ground beef', 'ing-3', unitConfig, 'metric', 1)
    expect(result).toBe('450 g ground beef')
  })

  it('applies unit conversion with "teaspoons"', () => {
    const config: UnitConversionConfig = {
      ...unitConfig,
      conversions: { 'ing-tsp': { amount: '5', unit: 'mL' } }
    }
    const result = transformIngredient('1 teaspoon salt', 'ing-tsp', config, 'metric', 1)
    expect(result).toBe('5 mL salt')
  })

  it('applies unit conversion case-insensitively', () => {
    const result = transformIngredient('2 Tablespoons olive oil', 'ing-2', unitConfig, 'metric', 1)
    expect(result).toBe('15 mL olive oil')
  })

  it('applies both unit conversion and servings with full unit words', () => {
    const result = transformIngredient('2 tablespoons olive oil', 'ing-2', unitConfig, 'metric', 2)
    expect(result).toBe('30 mL olive oil')
  })
})

// ─── transformIngredientValue ───────────────────────────────────────────────

describe('transformIngredientValue', () => {
  it('handles string ingredients', () => {
    const result = transformIngredientValue('2 cups sugar', null, null, null, 3)
    expect(result).toBe('6 cups sugar')
  })

  it('handles object ingredients with original_text', () => {
    const ingredient = { original_text: '2 cups sugar', link: 'https://example.com' }
    const result = transformIngredientValue(ingredient, null, null, null, 3)
    expect(typeof result).toBe('object')
    expect((result as any).original_text).toBe('6 cups sugar')
    expect((result as any).link).toBe('https://example.com')
  })
})

// ─── calculateAdjustedAmount ────────────────────────────────────────────────

describe('calculateAdjustedAmount', () => {
  it('adjusts whole numbers', () => {
    expect(calculateAdjustedAmount('2', 3)).toBe('6')
  })

  it('adjusts decimal numbers', () => {
    expect(calculateAdjustedAmount('1.5', 2)).toBe('3')
  })

  it('adjusts simple fractions', () => {
    expect(calculateAdjustedAmount('1/2', 2)).toBe('1')
  })

  it('adjusts mixed fractions', () => {
    expect(calculateAdjustedAmount('1 1/2', 2)).toBe('3')
  })

  it('adjusts ranges', () => {
    expect(calculateAdjustedAmount('1-2', 2)).toBe('2-4')
  })

  it('returns null for non-numeric input', () => {
    expect(calculateAdjustedAmount('some text', 2)).toBeNull()
  })
})

// ─── adjustFraction ─────────────────────────────────────────────────────────

describe('adjustFraction', () => {
  it('adjusts simple fraction 1/4 * 2 = 1/2', () => {
    expect(adjustFraction('1/4', 2)).toBe('1/2')
  })

  it('adjusts simple fraction 1/2 * 3 = 1 1/2', () => {
    expect(adjustFraction('1/2', 3)).toBe('1 1/2')
  })

  it('adjusts mixed fraction 2 1/4 * 2 = 4 1/2', () => {
    expect(adjustFraction('2 1/4', 2)).toBe('4 1/2')
  })

  it('returns null for non-fraction input', () => {
    expect(adjustFraction('hello', 2)).toBeNull()
  })
})

// ─── decimalToFraction ──────────────────────────────────────────────────────

describe('decimalToFraction', () => {
  it('converts whole numbers', () => {
    expect(decimalToFraction(3)).toBe('3')
  })

  it('converts 0.5 to 1/2', () => {
    expect(decimalToFraction(0.5)).toBe('1/2')
  })

  it('converts 1.5 to 1 1/2', () => {
    expect(decimalToFraction(1.5)).toBe('1 1/2')
  })

  it('converts 0.25 to 1/4', () => {
    expect(decimalToFraction(0.25)).toBe('1/4')
  })

  it('converts 2.75 to 2 3/4', () => {
    expect(decimalToFraction(2.75)).toBe('2 3/4')
  })

  it('converts 0.333 to 1/3', () => {
    expect(decimalToFraction(0.333)).toBe('1/3')
  })

  it('falls back to decimal for uncommon fractions', () => {
    // 0.43 is not close to any common fraction (> 0.05 tolerance)
    const result = decimalToFraction(1.43)
    expect(result).toBe('1.43')
  })
})

// ─── formatNumber ───────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('removes unnecessary decimals for whole numbers', () => {
    expect(formatNumber(4)).toBe('4')
    expect(formatNumber(4.0)).toBe('4')
  })

  it('keeps decimals for non-whole numbers', () => {
    expect(formatNumber(1.5)).toBe('1.5')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatNumber(1.333)).toBe('1.33')
    expect(formatNumber(2.666)).toBe('2.67')
  })
})

// ─── extractAmount ──────────────────────────────────────────────────────────

describe('extractAmount', () => {
  it('extracts whole numbers', () => {
    expect(extractAmount('2 cups flour')).toBe('2')
  })

  it('extracts fractions', () => {
    expect(extractAmount('1/2 tsp salt')).toBe('1/2')
  })

  it('extracts mixed fractions', () => {
    expect(extractAmount('1 1/2 cups water')).toBe('1 1/2')
  })

  it('extracts decimal amounts', () => {
    expect(extractAmount('1.5 oz butter')).toBe('1.5')
  })

  it('extracts ranges', () => {
    expect(extractAmount('1-2 tbsp oil')).toBe('1-2')
  })

  it('returns null for no-amount text', () => {
    expect(extractAmount('salt to taste')).toBeNull()
    expect(extractAmount('a pinch of pepper')).toBeNull()
  })
})
