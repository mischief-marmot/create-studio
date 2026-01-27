/**
 * Unit Conversion Utility
 *
 * Converts recipe ingredient amounts between US Customary and Metric systems.
 * Handles fractional amounts (e.g., "1/2", "1 1/2") and range amounts (max_amount).
 */

// --- Types ---

export interface ConversionIngredient {
  id: number
  amount: string
  unit: string
  max_amount?: string | null
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
  // Volume
  'cup':    { factor: 236.588, unit: 'mL' },
  'cups':   { factor: 236.588, unit: 'mL' },
  'tbsp':   { factor: 14.787,  unit: 'mL' },
  'tsp':    { factor: 4.929,   unit: 'mL' },
  'fl oz':  { factor: 29.574,  unit: 'mL' },
  // Weight
  'oz':     { factor: 28.3495, unit: 'g' },
  'lb':     { factor: 453.592, unit: 'g' },
  'lbs':    { factor: 453.592, unit: 'g' },
}

/**
 * Metric → US Customary conversion factors.
 */
const METRIC_TO_US: Record<string, { factor: number; unit: string }> = {
  'ml':  { factor: 1 / 236.588, unit: 'cups' },
  'mL':  { factor: 1 / 236.588, unit: 'cups' },
  'l':   { factor: 1000 / 236.588, unit: 'cups' },
  'L':   { factor: 1000 / 236.588, unit: 'cups' },
  'g':   { factor: 1 / 28.3495, unit: 'oz' },
  'kg':  { factor: 1000 / 28.3495, unit: 'oz' },
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

// --- Core Conversion ---

function convertIngredient(
  ingredient: ConversionIngredient,
  sourceSystem: string,
): ConversionResult {
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

  const parsedAmount = parseAmount(ingredient.amount)
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
export function convertBatch(request: BatchConversionRequest): BatchConversionResponse {
  const targetSystem = request.source_system === 'us_customary' ? 'metric' : 'us_customary'

  const conversions = request.ingredients.map((ingredient) =>
    convertIngredient(ingredient, request.source_system)
  )

  return {
    target_system: targetSystem,
    conversions,
  }
}
