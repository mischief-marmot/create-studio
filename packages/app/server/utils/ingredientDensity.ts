/**
 * Ingredient Density Lookup
 *
 * Looks up ingredient-specific gram weights from the USDA reference data
 * to convert volume measurements (cups, tbsp, tsp) to weight (grams)
 * for dry ingredients.
 */

import { eq, or } from 'drizzle-orm'
import { usdaFoods, usdaAliases } from '../db/schema'

export interface DensityResult {
  grams_per_unit: number
  unit: string  // always 'g'
  is_liquid: boolean
}

/**
 * Map volume unit strings to the corresponding column in usda_foods.
 */
const UNIT_TO_COLUMN: Record<string, 'cup_grams' | 'tbsp_grams' | 'tsp_grams'> = {
  cup: 'cup_grams',
  cups: 'cup_grams',
  c: 'cup_grams',
  tbsp: 'tbsp_grams',
  tablespoon: 'tbsp_grams',
  tablespoons: 'tbsp_grams',
  tsp: 'tsp_grams',
  teaspoon: 'tsp_grams',
  teaspoons: 'tsp_grams',
}

/**
 * Normalize an ingredient name for matching against USDA data.
 *
 * Handles real-world item strings like:
 *   "bread flour or all-purpose flour (420 grams)" → "bread flour"
 *   "¼ cups (156 grams) self-rising flour"         → "self-rising flour"
 *   "sugar (50 grams)"                             → "sugar"
 *   "lukewarm water (170 grams to 227 grams)"      → "lukewarm water"
 *   "fresh lemon juice"                            → "lemon juice"
 */
function normalizeIngredientName(name: string): string {
  let normalized = name.toLowerCase().trim()

  // Strip parenthetical notes: "(420 grams)", "(156 grams)", "(50 grams)", etc.
  normalized = normalized.replace(/\s*\([^)]*\)\s*/g, ' ').trim()

  // Strip leading amounts+units that leaked into item field: "¼ cups", "1 1/2 cup", etc.
  normalized = normalized.replace(/^[\d\s\/¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞.,]+\s*(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|pints?|quarts?|gallons?|ml|g|kg|fl\s*oz)\s+/i, '').trim()

  // Take only the first ingredient before " or " — "bread flour or all-purpose flour" → "bread flour"
  const orIndex = normalized.indexOf(' or ')
  if (orIndex > 0) {
    normalized = normalized.slice(0, orIndex).trim()
  }

  // Strip common adjectives that won't match USDA names
  normalized = normalized
    .replace(/\b(fresh|lukewarm|warm|cold|hot|room temperature|softened|melted|packed|sifted|unsifted|large|small|medium|finely|coarsely|chopped|minced|diced|sliced|grated|shredded)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Strip trailing 's' for simple plural handling, but not for words ending in 'ss' (e.g. "molasses")
  if (normalized.length > 3 && normalized.endsWith('s') && !normalized.endsWith('ss')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

// In-memory cache for the lifetime of a single request/batch
const densityCache = new Map<string, DensityResult | null>()

/**
 * Clear the density cache. Call between batch requests if reusing the module.
 */
export function clearDensityCache(): void {
  densityCache.clear()
}

/**
 * Look up the gram weight for an ingredient + volume unit from USDA data.
 *
 * Returns null if:
 * - The ingredient is not found in the database
 * - The unit is not a volume unit (cup/tbsp/tsp)
 * - The food doesn't have gram data for that unit
 *
 * @param ingredientName - The ingredient name (e.g., "bread flour", "sugar")
 * @param sourceUnit - The volume unit (e.g., "cup", "tbsp", "tsp")
 */
export async function lookupDensity(
  ingredientName: string,
  sourceUnit: string,
): Promise<DensityResult | null> {
  const unitLower = sourceUnit.toLowerCase().trim()
  const column = UNIT_TO_COLUMN[unitLower]

  console.log(`[Density] lookupDensity called — item: "${ingredientName}", unit: "${sourceUnit}", column: ${column ?? 'NONE'}`)

  if (!column) {
    return null  // Not a volume unit we can do density lookup for
  }

  const normalizedName = normalizeIngredientName(ingredientName)
  const cacheKey = `${normalizedName}:${column}`

  if (densityCache.has(cacheKey)) {
    const cached = densityCache.get(cacheKey)!
    console.log(`[Density] Cache hit for "${normalizedName}" → ${cached ? `${cached.grams_per_unit}g (liquid: ${cached.is_liquid})` : 'null'}`)
    return cached
  }

  // `db` is auto-imported from NuxtHub ('hub:db') in server context
  // Look up by exact USDA food name OR alias
  const rows = await db
    .select({
      cup_grams: usdaFoods.cup_grams,
      tbsp_grams: usdaFoods.tbsp_grams,
      tsp_grams: usdaFoods.tsp_grams,
      is_liquid: usdaFoods.is_liquid,
    })
    .from(usdaFoods)
    .leftJoin(usdaAliases, eq(usdaAliases.usda_food_id, usdaFoods.id))
    .where(
      or(
        eq(usdaFoods.name, normalizedName),
        eq(usdaAliases.alias, normalizedName),
      ),
    )
    .limit(1)

  console.log(`[Density] DB query for "${normalizedName}" returned ${rows.length} rows`)

  if (rows.length === 0) {
    // Try without the trailing 's' strip (original lowercased name)
    const originalLower = ingredientName.toLowerCase().trim()
    if (originalLower !== normalizedName) {
      const retryRows = await db
        .select({
          cup_grams: usdaFoods.cup_grams,
          tbsp_grams: usdaFoods.tbsp_grams,
          tsp_grams: usdaFoods.tsp_grams,
          is_liquid: usdaFoods.is_liquid,
        })
        .from(usdaFoods)
        .leftJoin(usdaAliases, eq(usdaAliases.usda_food_id, usdaFoods.id))
        .where(
          or(
            eq(usdaFoods.name, originalLower),
            eq(usdaAliases.alias, originalLower),
          ),
        )
        .limit(1)

      if (retryRows.length === 0) {
        densityCache.set(cacheKey, null)
        return null
      }

      return processRow(retryRows[0], column, cacheKey)
    }

    densityCache.set(cacheKey, null)
    return null
  }

  return processRow(rows[0], column, cacheKey)
}

function processRow(
  row: { cup_grams: number | null; tbsp_grams: number | null; tsp_grams: number | null; is_liquid: boolean | null },
  column: 'cup_grams' | 'tbsp_grams' | 'tsp_grams',
  cacheKey: string,
): DensityResult | null {
  const gramsPerUnit = row[column]

  if (gramsPerUnit === null || gramsPerUnit === undefined) {
    densityCache.set(cacheKey, null)
    return null
  }

  const result: DensityResult = {
    grams_per_unit: gramsPerUnit,
    unit: 'g',
    is_liquid: row.is_liquid ?? false,
  }

  densityCache.set(cacheKey, result)
  return result
}
