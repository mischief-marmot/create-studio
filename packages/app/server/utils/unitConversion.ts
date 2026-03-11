/**
 * Unit Conversion Utility
 *
 * Converts recipe ingredient amounts between US Customary and Metric systems.
 * Handles fractional amounts (e.g., "1/2", "1 1/2") and range amounts (max_amount).
 * Uses USDA ingredient-specific densities for dry ingredient volume→weight conversion.
 */

import { lookupDensity, clearDensityCache } from './ingredientDensity'

// --- Types ---

export interface ConversionIngredient {
  id: number
  amount: string
  unit: string
  max_amount?: string | null
  item?: string  // ingredient name for density-based conversion
}

export interface ConversionResult {
  id: number
  convertible: boolean
  amount: string | null
  unit: string | null
  max_amount: string | null
}

export interface BatchConversionRequest {
  creation_id: number
  source_system: 'us_customary' | 'metric'
  ingredients: ConversionIngredient[]
}

export interface BatchConversionResponse {
  target_system: string
  conversions: ConversionResult[]
}

// --- Conversion Tables ---

/**
 * US Customary → Metric conversion factors.
 * Each entry maps a US unit to its metric equivalent with a multiplier.
 */
const US_TO_METRIC: Record<string, { factor: number; unit: string }> = {
  // Volume - cups
  'cup':        { factor: 236.588, unit: 'mL' },
  'cups':       { factor: 236.588, unit: 'mL' },
  'c':          { factor: 236.588, unit: 'mL' },
  // Volume - tablespoons
  'tbsp':       { factor: 14.787,  unit: 'mL' },
  'tablespoon': { factor: 14.787,  unit: 'mL' },
  'tablespoons': { factor: 14.787, unit: 'mL' },
  'Tbsp':       { factor: 14.787,  unit: 'mL' },
  'T':          { factor: 14.787,  unit: 'mL' },
  // Volume - teaspoons
  'tsp':        { factor: 4.929,   unit: 'mL' },
  'teaspoon':   { factor: 4.929,   unit: 'mL' },
  'teaspoons':  { factor: 4.929,   unit: 'mL' },
  't':          { factor: 4.929,   unit: 'mL' },
  // Volume - fluid ounces
  'fl oz':      { factor: 29.574,  unit: 'mL' },
  'fluid oz':   { factor: 29.574,  unit: 'mL' },
  'fluid ounce': { factor: 29.574, unit: 'mL' },
  'fluid ounces': { factor: 29.574, unit: 'mL' },
  // Volume - pints
  'pint':       { factor: 473.176, unit: 'mL' },
  'pints':      { factor: 473.176, unit: 'mL' },
  'pt':         { factor: 473.176, unit: 'mL' },
  // Volume - quarts
  'quart':      { factor: 946.353, unit: 'mL' },
  'quarts':     { factor: 946.353, unit: 'mL' },
  'qt':         { factor: 946.353, unit: 'mL' },
  // Volume - gallons
  'gallon':     { factor: 3785.41, unit: 'mL' },
  'gallons':    { factor: 3785.41, unit: 'mL' },
  'gal':        { factor: 3785.41, unit: 'mL' },
  // Weight - ounces
  'oz':         { factor: 28.3495, unit: 'g' },
  'ounce':      { factor: 28.3495, unit: 'g' },
  'ounces':     { factor: 28.3495, unit: 'g' },
  // Weight - pounds
  'lb':         { factor: 453.592, unit: 'g' },
  'lbs':        { factor: 453.592, unit: 'g' },
  'pound':      { factor: 453.592, unit: 'g' },
  'pounds':     { factor: 453.592, unit: 'g' },
  // Weight - sticks (butter)
  'stick':      { factor: 113.4,   unit: 'g' },
  'sticks':     { factor: 113.4,   unit: 'g' },
}

/**
 * Metric → US Customary conversion factors.
 */
const METRIC_TO_US: Record<string, { factor: number; unit: string }> = {
  // Volume - milliliters
  'ml':         { factor: 1 / 236.588, unit: 'cups' },
  'mL':         { factor: 1 / 236.588, unit: 'cups' },
  'milliliter': { factor: 1 / 236.588, unit: 'cups' },
  'milliliters': { factor: 1 / 236.588, unit: 'cups' },
  // Volume - centiliters
  'cl':         { factor: 10 / 236.588, unit: 'cups' },
  'cL':         { factor: 10 / 236.588, unit: 'cups' },
  'centiliter': { factor: 10 / 236.588, unit: 'cups' },
  'centiliters': { factor: 10 / 236.588, unit: 'cups' },
  // Volume - deciliters
  'dl':         { factor: 100 / 236.588, unit: 'cups' },
  'dL':         { factor: 100 / 236.588, unit: 'cups' },
  'deciliter':  { factor: 100 / 236.588, unit: 'cups' },
  'deciliters': { factor: 100 / 236.588, unit: 'cups' },
  // Volume - liters
  'l':          { factor: 1000 / 236.588, unit: 'cups' },
  'L':          { factor: 1000 / 236.588, unit: 'cups' },
  'liter':      { factor: 1000 / 236.588, unit: 'cups' },
  'liters':     { factor: 1000 / 236.588, unit: 'cups' },
  'litre':      { factor: 1000 / 236.588, unit: 'cups' },
  'litres':     { factor: 1000 / 236.588, unit: 'cups' },
  // Weight - grams
  'g':          { factor: 1 / 28.3495, unit: 'oz' },
  'gram':       { factor: 1 / 28.3495, unit: 'oz' },
  'grams':      { factor: 1 / 28.3495, unit: 'oz' },
  // Weight - kilograms
  'kg':         { factor: 1000 / 28.3495, unit: 'oz' },
  'kilogram':   { factor: 1000 / 28.3495, unit: 'oz' },
  'kilograms':  { factor: 1000 / 28.3495, unit: 'oz' },
}

// --- Amount Parsing ---

/**
 * Parse a fractional or mixed-number amount string into a decimal.
 *
 * Handles: "1", "0.5", "1/2", "1 1/2", "1.5"
 */
function parseAmount(amount: string): number | null {
  const trimmed = amount.trim()
  if (!trimmed) return null

  // Pure decimal or integer: "1", "0.5", "1.5"
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed)
  }

  // Pure fraction: "1/2", "3/4"
  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10)
    const den = parseInt(fractionMatch[2], 10)
    return den === 0 ? null : num / den
  }

  // Mixed number: "1 1/2", "2 3/4"
  const mixedMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1])
    const num = parseInt(mixedMatch[2], 10)
    const den = parseInt(mixedMatch[3], 10)
    return den === 0 ? null : whole + num / den
  }

  return null
}

// --- Formatting ---

/**
 * Round a converted amount to a sensible precision and format as string.
 *
 * Strategy:
 * - Values >= 10: round to nearest 5
 * - Values >= 1: round to nearest integer
 * - Values < 1: round to 1 decimal
 */
function formatAmount(value: number): string {
  if (value >= 10) {
    return (Math.round(value / 5) * 5).toString()
  } else if (value >= 1) {
    return Math.round(value).toString()
  } else {
    let result = value.toFixed(1)
    if (result.includes('.')) {
      result = result.replace(/0+$/, '').replace(/\.$/, '')
    }
    return result
  }
}

/**
 * For metric volume results, upgrade mL to L when >= 1000.
 * For metric weight results, upgrade g to kg when >= 1000.
 * For US results, upgrade oz to lb when >= 16.
 */
function upgradeUnit(amount: number, unit: string): { amount: number; unit: string } {
  if (unit === 'mL' && amount >= 1000) {
    return { amount: amount / 1000, unit: 'L' }
  }
  if (unit === 'g' && amount >= 1000) {
    return { amount: amount / 1000, unit: 'kg' }
  }
  if (unit === 'oz' && amount >= 16) {
    return { amount: amount / 16, unit: 'lbs' }
  }
  if (unit === 'cups' && amount >= 4) {
    // Don't auto-upgrade cups to quarts — keep cups for recipe readability
  }
  return { amount, unit }
}

// --- Inline Conversion Detection ---

/**
 * Check if the ingredient item text already contains an inline metric conversion
 * like "(156 grams)", "(420 g)", "(250 mL)", "(1.5 L)".
 * If found, return it directly instead of computing a conversion.
 */
// Matches: (156 grams), (420 g), (250 mL), (1.5 L)
// Also ranges: (170 to 227 grams), (170 grams to 227 grams), (170-227 g)
const INLINE_METRIC_UNITS = 'grams?|g|kilograms?|kg|millilit(?:er|re)s?|mL|ml|lit(?:er|re)s?|L|l'
const INLINE_METRIC_PATTERN = new RegExp(
  `\\(\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:${INLINE_METRIC_UNITS})?\\s*(?:(?:to|-|–)\\s*(\\d+(?:[.,]\\d+)?)\\s*)?(?:${INLINE_METRIC_UNITS})\\s*\\)`,
  'i',
)

const INLINE_US_UNITS = 'cups?|tablespoons?|tbsp|teaspoons?|tsp|fl\\s*oz|fluid\\s*ounces?|ounces?|oz|pounds?|lbs?|pints?|quarts?|gallons?'
const INLINE_US_PATTERN = new RegExp(
  `\\(\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:${INLINE_US_UNITS})?\\s*(?:(?:to|-|–)\\s*(\\d+(?:[.,]\\d+)?)\\s*)?(?:${INLINE_US_UNITS})\\s*\\)`,
  'i',
)

/** Normalize inline unit strings to canonical form */
function normalizeInlineUnit(unit: string): string {
  const u = unit.toLowerCase().trim()
  if (/^g(rams?)?$/.test(u)) return 'g'
  if (/^kg|kilograms?$/.test(u)) return 'kg'
  if (/^ml|millilit(er|re)s?$/.test(u)) return 'mL'
  if (/^l$|^lit(er|re)s?$/.test(u)) return 'L'
  return unit
}

/**
 * Extract unit from the matched parenthetical text.
 * Finds the last unit-like word in the string.
 */
function extractUnitFromMatch(matchText: string, sourceSystem: string): string {
  const unitPattern = sourceSystem === 'us_customary'
    ? new RegExp(`(${INLINE_METRIC_UNITS})(?:\\s*\\))?$`, 'i')
    : new RegExp(`(${INLINE_US_UNITS})(?:\\s*\\))?$`, 'i')
  const m = matchText.replace(/\)\s*$/, '').trim().match(unitPattern)
  if (!m) return ''
  return sourceSystem === 'us_customary' ? normalizeInlineUnit(m[1]) : m[1]
}

function extractInlineConversion(
  item: string,
  sourceSystem: string,
): { amount: string; unit: string; max_amount: string | null } | null {
  if (!item) return null

  // When converting US→Metric, look for inline metric units
  // When converting Metric→US, look for inline US units
  const pattern = sourceSystem === 'us_customary' ? INLINE_METRIC_PATTERN : INLINE_US_PATTERN

  const match = item.match(pattern)
  if (!match) return null

  // match[1] = first number, match[2] = second number (range) or undefined
  const amount = match[1].replace(',', '.')
  const maxAmount = match[2] ? match[2].replace(',', '.') : null
  const unit = extractUnitFromMatch(match[0], sourceSystem)

  if (!unit) return null

  return { amount, unit, max_amount: maxAmount }
}

// --- Core Conversion ---

async function convertIngredient(
  ingredient: ConversionIngredient,
  sourceSystem: string,
): Promise<ConversionResult> {
  const parsedAmount = parseAmount(ingredient.amount)

  // Check if the item text already contains an inline conversion (e.g. "(156 grams)")
  if (ingredient.item) {
    const inline = extractInlineConversion(ingredient.item, sourceSystem)
    if (inline) {
      return {
        id: ingredient.id,
        convertible: true,
        amount: inline.amount,
        unit: inline.unit,
        max_amount: inline.max_amount,
      }
    }
  }

  // Try ingredient-specific density conversion for US→Metric volume units
  if (sourceSystem === 'us_customary' && ingredient.item && parsedAmount !== null) {
    const density = await lookupDensity(ingredient.item, ingredient.unit)
    if (density && !density.is_liquid) {
      let convertedAmount = parsedAmount * density.grams_per_unit
      let targetUnit = density.unit // 'g'

      const upgraded = upgradeUnit(convertedAmount, targetUnit)
      convertedAmount = upgraded.amount
      targetUnit = upgraded.unit

      // Handle max_amount
      let convertedMax: string | null = null
      if (ingredient.max_amount) {
        const parsedMax = parseAmount(ingredient.max_amount)
        if (parsedMax !== null) {
          let maxConverted = parsedMax * density.grams_per_unit
          const maxUpgraded = upgradeUnit(maxConverted, density.unit)
          if (maxUpgraded.unit === targetUnit) {
            convertedMax = formatAmount(maxUpgraded.amount)
          } else {
            convertedMax = formatAmount(maxConverted / (targetUnit === 'kg' ? 1000 : 1))
          }
        }
      }

      return {
        id: ingredient.id,
        convertible: true,
        amount: formatAmount(convertedAmount),
        unit: targetUnit,
        max_amount: convertedMax,
      }
    }
    // density is null or is_liquid → fall through to generic conversion
  }

  // --- Generic conversion (no density data or liquid) ---
  const table = sourceSystem === 'us_customary' ? US_TO_METRIC : METRIC_TO_US
  const unitLower = ingredient.unit.toLowerCase()

  // Find conversion entry (case-insensitive lookup with fallback to exact)
  const conversion = table[ingredient.unit] || table[unitLower]

  if (!conversion) {
    return {
      id: ingredient.id,
      convertible: false,
      amount: null,
      unit: null,
      max_amount: null,
    }
  }

  if (parsedAmount === null) {
    return {
      id: ingredient.id,
      convertible: false,
      amount: null,
      unit: null,
      max_amount: null,
    }
  }

  let convertedAmount = parsedAmount * conversion.factor
  let targetUnit = conversion.unit

  // Upgrade units if appropriate
  const upgraded = upgradeUnit(convertedAmount, targetUnit)
  convertedAmount = upgraded.amount
  targetUnit = upgraded.unit

  // Handle max_amount (for ranges like "1-2 cups")
  let convertedMax: string | null = null
  if (ingredient.max_amount) {
    const parsedMax = parseAmount(ingredient.max_amount)
    if (parsedMax !== null) {
      let maxConverted = parsedMax * conversion.factor
      const maxUpgraded = upgradeUnit(maxConverted, conversion.unit)
      // Use same unit as primary amount for consistency
      if (maxUpgraded.unit === targetUnit) {
        convertedMax = formatAmount(maxUpgraded.amount)
      } else {
        // Recalculate in the same unit as primary
        convertedMax = formatAmount(maxConverted / (targetUnit === 'L' ? 1000 : targetUnit === 'kg' ? 1000 : targetUnit === 'lbs' ? 16 : 1))
      }
    }
  }

  return {
    id: ingredient.id,
    convertible: true,
    amount: formatAmount(convertedAmount),
    unit: targetUnit,
    max_amount: convertedMax,
  }
}

// --- Public API ---

/**
 * Convert a batch of ingredients from one measurement system to another.
 */
export async function convertBatch(request: BatchConversionRequest): Promise<BatchConversionResponse> {
  const targetSystem = request.source_system === 'us_customary' ? 'metric' : 'us_customary'

  // Clear density cache at the start of each batch
  clearDensityCache()

  const conversions = await Promise.all(
    request.ingredients.map((ingredient) =>
      convertIngredient(ingredient, request.source_system)
    )
  )

  return {
    target_system: targetSystem,
    conversions,
  }
}
