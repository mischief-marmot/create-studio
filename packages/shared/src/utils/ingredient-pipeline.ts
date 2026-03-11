/**
 * Shared ingredient transformation pipeline
 *
 * Single source of truth for adjusting ingredient text.
 * Composition order: raw → unit conversion → servings multiplier
 *
 * Extracted from InteractiveExperience.vue and ServingsAdjusterWidget.vue
 * to eliminate duplication and ensure both widgets produce identical output.
 */

import type { UnitConversionConfig, MeasurementSystem } from './unit-conversion'

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Transform a single ingredient through the full pipeline.
 *
 * @param originalText      - The raw ingredient text from the DOM/data
 * @param ingredientId      - The ingredient's data-ingredient-id (for unit conversion lookup)
 * @param unitConfig        - UnitConversionConfig from the card, or null
 * @param targetSystem      - The active measurement system, or null if no conversion
 * @param servingsMultiplier - Servings multiplier (1 = no change)
 */
export function transformIngredient(
  originalText: string,
  ingredientId: string | null,
  unitConfig: UnitConversionConfig | null,
  targetSystem: MeasurementSystem | null,
  servingsMultiplier: number
): string {
  let text = originalText

  // Step 1: Unit conversion (replace amount+unit if converting)
  if (unitConfig && targetSystem && ingredientId && targetSystem !== unitConfig.source_system) {
    const conversion = unitConfig.conversions[ingredientId]
    if (conversion) {
      text = applyUnitConversion(text, conversion)
    }
  }

  // Step 2: Servings multiplier
  if (servingsMultiplier !== 1) {
    text = applyServingsMultiplier(text, servingsMultiplier)
  }

  return text
}

/**
 * Transform an ingredient that may be a string or RecipeIngredient object.
 * Used by InteractiveExperience where ingredients come from the HowTo schema.
 */
export function transformIngredientValue(
  ingredient: string | { original_text: string; link?: string; nofollow?: boolean },
  ingredientId: string | null,
  unitConfig: UnitConversionConfig | null,
  targetSystem: MeasurementSystem | null,
  servingsMultiplier: number
): string | { original_text: string; link?: string; nofollow?: boolean } {
  if (typeof ingredient === 'object' && ingredient.original_text) {
    const adjustedText = transformIngredient(
      ingredient.original_text,
      ingredientId,
      unitConfig,
      targetSystem,
      servingsMultiplier
    )
    return { ...ingredient, original_text: adjustedText }
  }

  return transformIngredient(
    ingredient as string,
    ingredientId,
    unitConfig,
    targetSystem,
    servingsMultiplier
  )
}

// ─── Unit conversion ────────────────────────────────────────────────────────

function applyUnitConversion(
  text: string,
  conversion: { amount: string; unit: string; max_amount?: string | null }
): string {
  // Match amount+unit at start of ingredient text
  // Handles abbreviations ("2 cups", "1 1/2 tbsp", "1/4 oz", "3.5 fl oz")
  // AND full words ("2 tablespoons", "1 teaspoon", "8 ounces", "1 pound")
  // Longer patterns listed first so they match before shorter ones
  const match = text.match(
    /^(\d+[¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚]|\d+\s+[¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚]|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚]|\d+(?:\.\d+)?)\s+(fluid\s+ounces?|fl\.?\s*oz\.?|tablespoons?|teaspoons?|ounces?|pounds?|gallons?|quarts?|pints?|cups?|tbsp\.?|tsp\.?|oz\.?|lbs?\.?|millilit(?:er|re)s?|kilograms?|lit(?:er|re)s?|grams?|mL|ml|L|l|kg|g)\b/i
  )

  if (match) {
    const rest = text.slice(match[0].length)
    return `${conversion.amount} ${conversion.unit}${rest}`
  }

  return text
}

// ─── Servings multiplier ────────────────────────────────────────────────────

function applyServingsMultiplier(text: string, multiplier: number): string {
  const amountMatch = text.match(/^([\d\s\/\.\-¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚]+)(.*)$/)
  if (!amountMatch) return text

  const numericPart = amountMatch[1].trim()
  const restOfIngredient = amountMatch[2].trim()

  const adjustedAmount = calculateAdjustedAmount(numericPart, multiplier)
  if (adjustedAmount) {
    return `${adjustedAmount} ${restOfIngredient}`
  }

  return text
}

// ─── Unicode fraction helpers ───────────────────────────────────────────────

const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 0.25, '½': 0.5, '¾': 0.75,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  '⅓': 1/3, '⅔': 2/3,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1/6, '⅚': 5/6,
}

const UNICODE_FRACTION_CHARS = Object.keys(UNICODE_FRACTIONS).join('')
const UNICODE_FRACTION_RE = new RegExp(`[${UNICODE_FRACTION_CHARS}]`)

/** Convert a string that may contain unicode fractions to a decimal number, or return null. */
function unicodeToDecimal(amount: string): number | null {
  const trimmed = amount.trim()

  // Standalone unicode fraction: "½"
  if (UNICODE_FRACTIONS[trimmed] !== undefined) {
    return UNICODE_FRACTIONS[trimmed]
  }

  // Number + unicode fraction (attached or spaced): "3½" or "3 ½"
  const match = trimmed.match(new RegExp(`^(\\d+)\\s*([${UNICODE_FRACTION_CHARS}])$`))
  if (match) {
    return parseInt(match[1]) + (UNICODE_FRACTIONS[match[2]] ?? 0)
  }

  return null
}

// ─── Amount calculation helpers ─────────────────────────────────────────────

export function calculateAdjustedAmount(amount: string, multiplier: number): string | null {
  // Handle unicode fractions first (e.g., "3½", "1 ¼", "½")
  if (UNICODE_FRACTION_RE.test(amount)) {
    // Handle ranges with unicode fractions (e.g., "¾-1")
    if (amount.includes('-')) {
      const parts = amount.split('-').map(p => p.trim())
      const adjustedParts = parts.map(part => {
        const dec = unicodeToDecimal(part)
        if (dec !== null) return decimalToFraction(dec * multiplier)
        const num = parseFloat(part)
        if (!isNaN(num)) return formatNumber(num * multiplier)
        return part
      })
      return adjustedParts.join('-')
    }

    const decimal = unicodeToDecimal(amount)
    if (decimal !== null) {
      return decimalToFraction(decimal * multiplier)
    }
  }

  // Check for mixed fractions first (e.g., "2 1/4")
  if (/^\d+\s+\d+\/\d+$/.test(amount)) {
    return adjustFraction(amount, multiplier)
  }

  // Handle simple fractions (e.g., "1/2")
  if (amount.includes('/')) {
    return adjustFraction(amount, multiplier)
  }

  // Handle ranges
  if (amount.includes('-')) {
    const parts = amount.split('-').map(p => p.trim())
    const adjustedParts = parts.map(part => {
      if (part.includes('/')) {
        return adjustFraction(part, multiplier) || part
      }
      const num = parseFloat(part)
      if (!isNaN(num)) {
        return formatNumber(num * multiplier)
      }
      return part
    })
    return adjustedParts.join('-')
  }

  // Handle regular numbers
  const num = parseFloat(amount)
  if (!isNaN(num)) {
    return formatNumber(num * multiplier)
  }

  return null
}

export function adjustFraction(fraction: string, multiplier: number): string | null {
  // Handle mixed fractions like "2 1/4"
  const mixedMatch = fraction.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1])
    const numerator = parseInt(mixedMatch[2])
    const denominator = parseInt(mixedMatch[3])
    const decimal = whole + (numerator / denominator)
    const adjusted = decimal * multiplier
    return decimalToFraction(adjusted)
  }

  // Handle simple fractions like "1/2"
  const simpleMatch = fraction.match(/^(\d+)\/(\d+)$/)
  if (simpleMatch) {
    const numerator = parseInt(simpleMatch[1])
    const denominator = parseInt(simpleMatch[2])
    const decimal = numerator / denominator
    const adjusted = decimal * multiplier
    return decimalToFraction(adjusted)
  }

  return null
}

export function decimalToFraction(decimal: number): string {
  const whole = Math.floor(decimal)
  const remainder = decimal - whole

  if (remainder === 0) {
    return whole.toString()
  }

  // Common fractions
  const fractions = [
    { value: 0.125, str: '1/8' },
    { value: 0.25, str: '1/4' },
    { value: 0.333, str: '1/3' },
    { value: 0.375, str: '3/8' },
    { value: 0.5, str: '1/2' },
    { value: 0.625, str: '5/8' },
    { value: 0.666, str: '2/3' },
    { value: 0.75, str: '3/4' },
    { value: 0.875, str: '7/8' }
  ]

  // Find closest fraction
  let closest = fractions[0]
  let minDiff = Math.abs(remainder - fractions[0].value)

  for (const frac of fractions) {
    const diff = Math.abs(remainder - frac.value)
    if (diff < minDiff) {
      minDiff = diff
      closest = frac
    }
  }

  // If difference is too large, use decimal
  if (minDiff > 0.05) {
    return formatNumber(decimal)
  }

  if (whole > 0) {
    return `${whole} ${closest.str}`
  }

  return closest.str
}

export function formatNumber(num: number): string {
  // Remove unnecessary decimals
  if (num % 1 === 0) {
    return num.toString()
  }

  // Round to 2 decimal places
  return (Math.round(num * 100) / 100).toString()
}

/**
 * Extract a numeric amount from the start of ingredient text.
 * Returns the matched amount string or null.
 */
export function extractAmount(text: string): string | null {
  const patterns = [
    /^(\d+[¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚])\s+/, // Number directly followed by unicode fraction like "1¼"
    /^(\d+\s+[¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚])\s+/, // Number + space + unicode fraction like "1 ¼"
    /^(\d+\s+\d+\/\d+)\s+/, // Mixed fractions like "2 1/4"
    /^(\d+\/\d+)\s+/,       // Simple fractions like "1/2"
    /^([¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚]\s*-\s*\d+(?:\.\d+)?)\s+/, // Unicode fraction range like "¾-1"
    /^([¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚])\s+/, // Standalone unicode fraction like "½"
    /^(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s+/, // Numbers like "2" or "1.5" or "1-2"
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}
