# Plan: Volume-to-Gram Conversion for Nutrition API

## Context

The API Ninjas `/v1/nutritionitem` endpoint has incorrect volume-to-weight conversions for certain ingredients (e.g., "1/2 cup rolled oats" returns 125g/468 cal instead of the correct ~40g/150 cal — it uses cooked oatmeal density instead of dry). Since the API's per-gram data is accurate, we can bypass its broken volume conversions by converting volume quantities to gram weights ourselves before sending to the API.

Additionally, the previous commit to include the `unit` field in structured ingredients won't work yet because both API endpoints (`v1/` and `v2/`) strip the `unit` field when mapping request body to `recipeData`.

## Changes

### 1. Pass `unit` through API endpoints

**Files:**
- `packages/app/server/api/v1/nutrition/recipe.post.ts` (line 79-83)
- `packages/app/server/api/v2/nutrition/recipe.post.ts` (line 79-83)

Add `unit: ingredient.unit` to the ingredient mapping in both files.

### 2. Create volume-to-gram conversion utility

**New file:** `packages/app/server/utils/volumeToGram.ts`

A lookup table of ~25-30 common recipe ingredients with their USDA grams-per-cup values. The utility:

- Exports a `convertVolumeToGrams(quantity: string, item: string): string` function
- Parses the quantity string to extract numeric amount and unit (reuse `parseAmount()` pattern from `unitConversion.ts`)
- Checks if the unit is a volume unit (cup, tablespoon, teaspoon)
- Fuzzy-matches the item name against the density table (lowercase, check if item contains or starts with a key)
- If a match is found: converts to grams (amount × unit-fraction-of-cup × grams-per-cup) and returns e.g. `"40g"`
- If no match: returns the original quantity string unchanged (API handles it)

**Density table scope** (grams per cup, USDA FoodData Central):

| Category | Ingredients |
|----------|------------|
| Grains/cereals | rolled oats (80g), flour/all-purpose flour (125g), bread flour (130g), whole wheat flour (120g), rice (185g), quinoa (170g), cornmeal (150g) |
| Seeds/nuts | sunflower seeds (140g), chia seeds (160g), flaxseed (150g), hemp seeds (160g), almond flour (96g), peanut butter (258g) |
| Sugars | sugar/granulated sugar (200g), brown sugar (220g), powdered sugar (120g), honey (340g), maple syrup (315g) |
| Dairy/liquids | milk (245g), butter (227g), cream cheese (232g), sour cream (230g), yogurt (245g) |
| Powders | protein powder (120g), cocoa powder (86g), baking powder (220g) |

Volume unit conversion factors (fraction of 1 cup):
- 1 cup = 1
- 1 tablespoon = 1/16
- 1 teaspoon = 1/48

### 3. Integrate into nutrition calculation flow

**File:** `packages/app/server/utils/apiNinjasNutritionItem.ts`

In `calculateRecipeNutritionWithItems()`, after parsing produces `{ quantity, item }` but before calling `fetchNutritionForIngredient()` (~line 323), apply the conversion:

```typescript
const nutritionPromises = successfullyParsed.map(parsed => {
  const convertedQuantity = convertVolumeToGrams(parsed.quantity, parsed.item)
  return fetchNutritionForIngredient(parsed.item, convertedQuantity, config.apiNinjasKey)
})
```

### 4. Write tests (TDD)

**New file:** `packages/app/server/tests/unit/volume-to-gram.test.ts`

Following the pattern from `unit-conversion.test.ts`:

- Converts known ingredients: `"1/2 cup rolled oats"` → `"40g"`
- Converts tablespoons: `"2 tablespoons sunflower seeds"` → `"17.5g"`
- Converts teaspoons: `"1 teaspoon honey"` → `"7.08g"`
- Handles abbreviations: `"2 tbsp"`, `"1 tsp"`, `"1/2 c"`
- Handles fractions and mixed numbers: `"1 1/2 cups"`, `"1/4 cup"`
- Passes through unmatched ingredients unchanged: `"1 cup exotic-ingredient"` → `"1 cup"`
- Passes through non-volume units unchanged: `"100g flour"` → `"100g"`
- Passes through bare numbers unchanged: `"2"` → `"2"`
- Case-insensitive item matching

## Verification

1. Run new unit tests: `npm test packages/app/server/tests/unit/volume-to-gram.test.ts`
2. Run existing nutrition tests: `npm test tests/unit/nutrition-api.test.ts`
3. Run existing unit conversion tests: `npm test packages/app/server/tests/unit/unit-conversion.test.ts`
4. Manual verification: call API with rolled oats and sunflower seeds, confirm gram-based quantities are sent
