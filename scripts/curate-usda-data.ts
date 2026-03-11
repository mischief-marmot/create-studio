/**
 * USDA SR Legacy Data Curation Script
 *
 * Processes USDA SR Legacy CSV files (food.csv + food_portion.csv) and outputs
 * a SQL seed migration with INSERT statements for usda_foods and usda_aliases.
 *
 * Usage:
 *   npx tsx scripts/curate-usda-data.ts /tmp/food.csv /tmp/food_portion.csv
 *
 * Downloads:
 *   https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
 *
 * Output:
 *   packages/app/server/db/migrations/0023_seed-usda-data.sql
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// --- CSV Parsing ---

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n')
  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// --- Liquid Detection ---

const LIQUID_KEYWORDS = [
  'water', 'milk', 'juice', 'broth', 'stock', 'oil', 'vinegar',
  'sauce', 'syrup', 'honey', 'cream', 'buttermilk', 'yogurt',
  'wine', 'beer', 'spirits', 'liqueur', 'extract', 'lemon juice',
  'lime juice', 'orange juice', 'apple juice', 'coconut milk',
  'soy milk', 'almond milk', 'maple syrup', 'corn syrup',
  'molasses', 'ketchup', 'mustard', 'soy sauce', 'fish sauce',
  'worcestershire', 'hot sauce', 'salsa', 'tomato paste',
]

function isLiquid(name: string): boolean {
  const lower = name.toLowerCase()
  return LIQUID_KEYWORDS.some(kw => lower.includes(kw))
}

// --- Name Normalization ---

function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replace(/,\s*(enriched|unenriched|bleached|unbleached|self-rising|bromated|unbromated).*$/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

// --- Modifier Matching ---

const CUP_MODIFIERS = ['cup', 'cup,', 'cups']
const TBSP_MODIFIERS = ['tbsp', 'tablespoon', 'tablespoons']
const TSP_MODIFIERS = ['tsp', 'teaspoon', 'teaspoons']

function matchesModifier(modifier: string, targets: string[]): boolean {
  const lower = modifier.toLowerCase().trim()
  return targets.some(t => lower === t || lower.startsWith(t + ' ') || lower.startsWith(t + ','))
}

// --- Alias Map ---
// Common recipe terms → normalized USDA food name
const ALIAS_MAP: Record<string, string> = {
  // Flours
  'flour': 'wheat flour, white, all-purpose',
  'all-purpose flour': 'wheat flour, white, all-purpose',
  'ap flour': 'wheat flour, white, all-purpose',
  'plain flour': 'wheat flour, white, all-purpose',
  'bread flour': 'wheat flour, white, bread',
  'strong flour': 'wheat flour, white, bread',
  'cake flour': 'wheat flour, white, cake',
  'pastry flour': 'wheat flour, white, cake',
  'whole wheat flour': 'wheat flour, whole-grain',
  'wholemeal flour': 'wheat flour, whole-grain',
  'self-rising flour': 'wheat flour, white, all-purpose',
  'self rising flour': 'wheat flour, white, all-purpose',
  'rye flour': 'rye flour, medium',
  'almond flour': 'almond flour',
  'coconut flour': 'coconut flour',
  'cornstarch': 'cornstarch',
  'corn starch': 'cornstarch',

  // Sugars
  'sugar': 'sugars, granulated',
  'white sugar': 'sugars, granulated',
  'granulated sugar': 'sugars, granulated',
  'caster sugar': 'sugars, granulated',
  'brown sugar': 'sugars, brown',
  'light brown sugar': 'sugars, brown',
  'dark brown sugar': 'sugars, brown',
  'powdered sugar': 'sugars, powdered',
  'confectioners sugar': 'sugars, powdered',
  'icing sugar': 'sugars, powdered',

  // Fats
  'butter': 'butter, salted',
  'unsalted butter': 'butter, without salt',
  'salted butter': 'butter, salted',
  'margarine': 'margarine, regular',
  'shortening': 'shortening, household, soybean',
  'vegetable shortening': 'shortening, household, soybean',
  'lard': 'lard',
  'coconut oil': 'oil, coconut',
  'olive oil': 'oil, olive, salad or cooking',
  'vegetable oil': 'oil, soybean, salad or cooking',
  'canola oil': 'oil, canola',

  // Dairy
  'milk': 'milk, whole',
  'whole milk': 'milk, whole',
  'skim milk': 'milk, nonfat, fluid',
  'heavy cream': 'cream, fluid, heavy whipping',
  'whipping cream': 'cream, fluid, heavy whipping',
  'half and half': 'cream, fluid, half and half',
  'sour cream': 'cream, sour, cultured',
  'cream cheese': 'cheese, cream',
  'buttermilk': 'buttermilk, fluid, cultured',
  'yogurt': 'yogurt, plain, whole milk',
  'greek yogurt': 'yogurt, greek, plain',
  'evaporated milk': 'milk, canned, evaporated',
  'condensed milk': 'milk, canned, condensed, sweetened',
  'sweetened condensed milk': 'milk, canned, condensed, sweetened',

  // Eggs & Leavening
  'baking powder': 'leavening agents, baking powder',
  'baking soda': 'leavening agents, baking soda',
  'cocoa powder': 'cocoa, dry powder, unsweetened',
  'cocoa': 'cocoa, dry powder, unsweetened',
  'unsweetened cocoa': 'cocoa, dry powder, unsweetened',

  // Grains & Starches
  'rice': 'rice, white, long-grain, regular, raw',
  'white rice': 'rice, white, long-grain, regular, raw',
  'brown rice': 'rice, brown, long-grain, raw',
  'rolled oats': 'oats, regular and quick',
  'oats': 'oats, regular and quick',
  'oatmeal': 'oats, regular and quick',
  'cornmeal': 'cornmeal, whole-grain, yellow',
  'breadcrumbs': 'bread crumbs, dry, grated',
  'panko': 'bread crumbs, dry, grated',

  // Nuts & Seeds
  'almonds': 'nuts, almonds',
  'walnuts': 'nuts, walnuts, english',
  'pecans': 'nuts, pecans',
  'peanuts': 'peanuts, all types, raw',
  'cashews': 'nuts, cashew nuts, raw',
  'peanut butter': 'peanut butter, smooth',
  'almond butter': 'nut butters, almond butter',
  'flax seeds': 'seeds, flaxseed',
  'flaxseed': 'seeds, flaxseed',
  'chia seeds': 'seeds, chia seeds, dried',
  'sesame seeds': 'seeds, sesame seeds, whole, dried',
  'sunflower seeds': 'seeds, sunflower seed kernels, dried',
  'poppy seeds': 'seeds, sesame seeds, whole, dried',

  // Chocolate & Sweet
  'chocolate chips': 'chocolate, dark, 60-69% cacao solids',
  'semi-sweet chocolate chips': 'chocolate, dark, 60-69% cacao solids',
  'dark chocolate chips': 'chocolate, dark, 70-85% cacao solids',
  'white chocolate chips': 'baking chocolate, white',
  'maple syrup': 'syrups, maple',
  'honey': 'honey',
  'molasses': 'molasses',
  'corn syrup': 'syrups, corn, light',
  'jam': 'jams and preserves',
  'jelly': 'jams and preserves',
  'preserves': 'jams and preserves',

  // Dried Fruit
  'raisins': 'raisins, seedless',
  'dried cranberries': 'cranberries, dried, sweetened',
  'dates': 'dates, medjool',
  'dried apricots': 'apricots, dried, sulfured',
  'shredded coconut': 'coconut meat, dried, sweetened, shredded',
  'desiccated coconut': 'coconut meat, dried, sweetened, shredded',

  // Spices & Seasonings
  'salt': 'salt, table',
  'table salt': 'salt, table',
  'kosher salt': 'salt, table',
  'sea salt': 'salt, table',
  'black pepper': 'spices, pepper, black',
  'pepper': 'spices, pepper, black',
  'cinnamon': 'spices, cinnamon, ground',
  'ground cinnamon': 'spices, cinnamon, ground',
  'paprika': 'spices, paprika',
  'cumin': 'spices, cumin seed',
  'ground cumin': 'spices, cumin seed',
  'chili powder': 'spices, chili powder',
  'garlic powder': 'spices, garlic powder',
  'onion powder': 'spices, onion powder',
  'ginger': 'spices, ginger, ground',
  'ground ginger': 'spices, ginger, ground',
  'nutmeg': 'spices, nutmeg, ground',
  'ground nutmeg': 'spices, nutmeg, ground',
  'turmeric': 'spices, turmeric, ground',
  'oregano': 'spices, oregano, dried',
  'dried oregano': 'spices, oregano, dried',
  'thyme': 'spices, thyme, dried',
  'dried thyme': 'spices, thyme, dried',
  'basil': 'spices, basil, dried',
  'dried basil': 'spices, basil, dried',
  'rosemary': 'spices, rosemary, dried',
  'dried rosemary': 'spices, rosemary, dried',
  'parsley': 'spices, parsley, dried',
  'dried parsley': 'spices, parsley, dried',

  // Liquids
  'water': 'water, tap, drinking',
  'broth': 'soup, stock, chicken, ready-to-serve',
  'chicken broth': 'soup, stock, chicken, ready-to-serve',
  'beef broth': 'soup, stock, beef, ready-to-serve',
  'vegetable broth': 'soup, stock, vegetable, ready-to-serve',
  'chicken stock': 'soup, stock, chicken, ready-to-serve',
  'beef stock': 'soup, stock, beef, ready-to-serve',
  'apple cider vinegar': 'vinegar, cider',
  'white vinegar': 'vinegar, distilled',
  'red wine vinegar': 'vinegar, red wine',
  'balsamic vinegar': 'vinegar, balsamic',
  'soy sauce': 'soy sauce',
  'vanilla extract': 'vanilla extract',
  'vanilla': 'vanilla extract',
  'lemon juice': 'lemon juice, raw',
  'lime juice': 'lime juice, raw',

  // Cheese
  'parmesan': 'cheese, parmesan, grated',
  'parmesan cheese': 'cheese, parmesan, grated',
  'cheddar cheese': 'cheese, cheddar',
  'cheddar': 'cheese, cheddar',
  'mozzarella': 'cheese, mozzarella, whole milk',
  'mozzarella cheese': 'cheese, mozzarella, whole milk',
  'ricotta': 'cheese, ricotta, whole milk',
  'ricotta cheese': 'cheese, ricotta, whole milk',
  'cottage cheese': 'cheese, cottage, creamed',
  'feta': 'cheese, feta',
  'feta cheese': 'cheese, feta',
}

// --- Main ---

function main() {
  const [foodPath, portionPath] = process.argv.slice(2)

  if (!foodPath || !portionPath) {
    console.log('Usage: npx tsx scripts/curate-usda-data.ts <food.csv> <food_portion.csv>')
    console.log('')
    console.log('Download SR Legacy data from:')
    console.log('https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip')
    process.exit(1)
  }

  console.log('Reading CSV files...')
  const foods = parseCSV(readFileSync(foodPath, 'utf-8'))
  const portions = parseCSV(readFileSync(portionPath, 'utf-8'))

  console.log(`Loaded ${foods.length} foods, ${portions.length} portions`)

  // Index foods by fdc_id
  const foodById = new Map<string, Record<string, string>>()
  for (const food of foods) {
    foodById.set(food.fdc_id, food)
  }

  // Process portions — collect gram weights per unit for each food
  interface FoodData {
    fdc_id: number
    name: string
    category: string
    cup_grams: number | null
    tbsp_grams: number | null
    tsp_grams: number | null
    is_liquid: boolean
  }

  const foodMap = new Map<string, FoodData>()

  for (const portion of portions) {
    const food = foodById.get(portion.fdc_id)
    if (!food) continue

    const modifier = (portion.modifier || '').toLowerCase().trim()
    const gramWeight = parseFloat(portion.gram_weight)
    const amount = parseFloat(portion.amount) || 1

    if (isNaN(gramWeight) || gramWeight <= 0) continue

    const perUnit = gramWeight / amount
    const normalizedName = normalizeFoodName(food.description || '')
    if (!normalizedName) continue

    let entry = foodMap.get(normalizedName)
    if (!entry) {
      entry = {
        fdc_id: parseInt(food.fdc_id, 10),
        name: normalizedName,
        category: food.food_category_id || '',
        cup_grams: null,
        tbsp_grams: null,
        tsp_grams: null,
        is_liquid: isLiquid(normalizedName),
      }
      foodMap.set(normalizedName, entry)
    }

    // Prefer plain "cup" over "cup sifted" etc.
    if (matchesModifier(modifier, CUP_MODIFIERS)) {
      if (entry.cup_grams === null || modifier === 'cup') {
        entry.cup_grams = Math.round(perUnit * 10) / 10
      }
    } else if (matchesModifier(modifier, TBSP_MODIFIERS)) {
      if (entry.tbsp_grams === null || modifier === 'tbsp') {
        entry.tbsp_grams = Math.round(perUnit * 100) / 100
      }
    } else if (matchesModifier(modifier, TSP_MODIFIERS)) {
      if (entry.tsp_grams === null || modifier === 'tsp') {
        entry.tsp_grams = Math.round(perUnit * 100) / 100
      }
    }
  }

  // Filter out foods with no gram weights at all
  const validFoods = Array.from(foodMap.values())
    .filter(f => f.cup_grams !== null || f.tbsp_grams !== null || f.tsp_grams !== null)
    .sort((a, b) => a.name.localeCompare(b.name))

  console.log(`Found ${validFoods.length} foods with gram weights`)

  // Build alias → food name mapping (only for foods we have)
  const foodNames = new Set(validFoods.map(f => f.name))
  const validAliases: { alias: string; foodName: string }[] = []

  for (const [alias, foodName] of Object.entries(ALIAS_MAP)) {
    if (foodNames.has(foodName)) {
      validAliases.push({ alias, foodName })
    }
  }

  console.log(`Found ${validAliases.length} valid aliases`)

  // Generate SQL
  const lines: string[] = [
    '-- Migration 0023: Seed USDA reference data for ingredient-specific unit conversion',
    '-- Generated by scripts/curate-usda-data.ts from USDA SR Legacy dataset',
    `-- ${validFoods.length} foods, ${validAliases.length} aliases`,
    '',
    '-- Insert foods',
  ]

  for (const food of validFoods) {
    const name = food.name.replace(/'/g, "''")
    const category = food.category ? `'${food.category.replace(/'/g, "''")}'` : 'NULL'
    const cupGrams = food.cup_grams !== null ? food.cup_grams : 'NULL'
    const tbspGrams = food.tbsp_grams !== null ? food.tbsp_grams : 'NULL'
    const tspGrams = food.tsp_grams !== null ? food.tsp_grams : 'NULL'

    lines.push(
      `INSERT INTO usda_foods (fdc_id, name, category, is_liquid, cup_grams, tbsp_grams, tsp_grams) VALUES (${food.fdc_id}, '${name}', ${category}, ${food.is_liquid ? 1 : 0}, ${cupGrams}, ${tbspGrams}, ${tspGrams});`
    )
  }

  lines.push('')
  lines.push('-- Insert aliases')

  for (const { alias, foodName } of validAliases) {
    const escapedAlias = alias.replace(/'/g, "''")
    const escapedName = foodName.replace(/'/g, "''")
    lines.push(
      `INSERT INTO usda_aliases (alias, usda_food_id) VALUES ('${escapedAlias}', (SELECT id FROM usda_foods WHERE name = '${escapedName}'));`
    )
  }

  lines.push('')

  const outputPath = resolve(__dirname, '../packages/app/server/db/migrations/0023_seed-usda-data.sql')
  writeFileSync(outputPath, lines.join('\n'), 'utf-8')
  console.log(`Written to ${outputPath}`)
}

main()
