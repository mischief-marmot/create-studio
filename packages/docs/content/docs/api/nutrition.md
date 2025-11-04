---
title: Nutrition API
description: Calculate recipe nutrition using API Ninjas
---

# Nutrition API

The Nutrition API endpoint calculates nutritional information for recipes using the [API Ninjas Nutrition API](https://api-ninjas.com/api/nutrition).

## Endpoint

```
POST /api/v1/nutrition/recipe
```

## Overview

This endpoint analyzes recipe ingredients and returns detailed nutritional information including calories, macronutrients (protein, fat, carbohydrates), vitamins, and minerals. It supports both per-serving and total recipe calculations.

### Key Features

- **Intelligent Parsing**: Automatically extracts quantities and ingredients from text
- **Pre-populated Data Support**: Accepts structured `item` and `amount` properties
- **Unicode Fraction Support**: Handles fractions like ½, ¼, 1¼ natively
- **Parallel Processing**: Fetches nutrition data for all ingredients simultaneously
- **Smart Skipping**: Excludes unparseable ingredients (e.g., "salt to taste")

## Authentication

Requires a valid JWT token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

- **15 requests per 5 minutes** per user
- Rate limits are tracked per user email
- Returns `429` status code when limit exceeded

## Request Format

### Request Body

```json
{
  "title": "Recipe Name",
  "yield": 4,
  "ingredients": [
    {
      "original_text": "1 cup flour",
      "item": "flour",         // Optional: pre-populated ingredient name
      "amount": "1 cup"        // Optional: pre-populated quantity
    },
    {
      "original_text": "2 large eggs"
    },
    {
      "original_text": "½ teaspoon salt"
    }
  ],
  "nutrition": [
    { "id": "number_of_servings", "amount": "4" },
    { "id": "calories" },
    { "id": "total_fat" },
    { "id": "saturated_fat" },
    { "id": "protein" },
    { "id": "carbohydrates" },
    { "id": "fiber" },
    { "id": "sugar" },
    { "id": "sodium" },
    { "id": "cholesterol" },
    { "id": "potassium" },
    { "id": "net_carbs" }
  ]
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **title** | string | Yes | Recipe title |
| **yield** | number | No | Number of servings (can also be set in nutrition array) |
| **ingredients** | array | Yes | Array of ingredient objects |
| **ingredients[].original_text** | string | Yes | Full ingredient text (e.g., "1 cup flour") |
| **ingredients[].item** | string | No | Pre-parsed ingredient name (e.g., "flour") |
| **ingredients[].amount** | string | No | Pre-parsed quantity (e.g., "1 cup") |
| **nutrition** | array | Yes | Array of nutrition fields to calculate |
| **nutrition[].id** | string | Yes | Nutrition field identifier |
| **nutrition[].amount** | string/number | No | Pre-existing value (if any) |

### Ingredient Formats

The API supports various ingredient formats:

**With Pre-populated Data** (preferred):
```json
{
  "original_text": "1 cup all-purpose flour",
  "item": "all-purpose flour",
  "amount": "1 cup"
}
```

**Auto-parsed from Text**:
```json
{ "original_text": "2 tablespoons olive oil" }
{ "original_text": "1¼ cups cottage cheese" }
{ "original_text": "scant ½ teaspoon salt" }
{ "original_text": "6 large eggs" }
```

**Skipped Ingredients** (no parseable quantity):
```json
{ "original_text": "Salt and pepper to taste" }
{ "original_text": "Fresh basil for garnish" }
```

## Response Format

### Success Response (200 OK)

```json
{
  "data": {
    "nutrition": [
      { "id": "calories", "amount": 250 },
      { "id": "total_fat", "amount": 10.5 },
      { "id": "saturated_fat", "amount": 3.2 },
      { "id": "protein", "amount": 8.1 },
      { "id": "carbohydrates", "amount": 35.2 },
      { "id": "fiber", "amount": 2.1 },
      { "id": "sugar", "amount": 4.5 },
      { "id": "sodium", "amount": 180 },
      { "id": "cholesterol", "amount": 15 },
      { "id": "potassium", "amount": 120 },
      { "id": "net_carbs", "amount": 33.1 }
    ],
    "totalNutrition": [
      { "id": "calories", "amount": 1000 },
      { "id": "total_fat", "amount": 42 },
      { "id": "saturated_fat", "amount": 12.8 },
      { "id": "protein", "amount": 32.4 },
      { "id": "carbohydrates", "amount": 140.8 },
      { "id": "fiber", "amount": 8.4 },
      { "id": "sugar", "amount": 18 },
      { "id": "sodium", "amount": 720 },
      { "id": "cholesterol", "amount": 60 },
      { "id": "potassium", "amount": 480 },
      { "id": "net_carbs", "amount": 132.4 }
    ],
    "ingredientsNotFound": [
      "Salt and pepper to taste",
      "Fresh basil for garnish"
    ]
  }
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| **nutrition** | Per-serving nutrition values (total ÷ number of servings) |
| **totalNutrition** | Complete recipe nutrition (sum of all ingredients) |
| **ingredientsNotFound** | Ingredients that couldn't be parsed or found in API |

### Error Responses

**400 Bad Request** - Invalid request body:
```json
{
  "error": "Recipe title is required"
}
```

**400 Bad Request** - API Ninjas error:
```json
{
  "status": 400,
  "message": "Nutrition API error"
}
```

**401 Unauthorized** - Invalid or missing JWT token

**429 Too Many Requests** - Rate limit exceeded

**500 Internal Server Error** - Server-side error

## Ingredient Parsing

The API uses sophisticated parsing to extract quantities and ingredients:

### Supported Formats

- **Fractions**: `"1/2 cup"`, `"1 1/2 cups"`
- **Unicode Fractions**: `"½ cup"`, `"¼ teaspoon"`, `"1¼ cups"`
- **Modifiers**: `"scant ½ teaspoon"`, `"heaping tablespoon"`
- **Decimals**: `"2.5 tablespoons"`
- **Whole Items**: `"2 eggs"`, `"6 large eggs"`
- **Units**: oz, lb, g, kg, cup, tbsp, tsp, can, container, box, etc.

### Parsing Examples

| Input | Parsed Quantity | Parsed Item |
|-------|----------------|-------------|
| `"1 cup flour"` | `"1 cup"` | `"flour"` |
| `"1¼ cups cottage cheese"` | `"1¼ cups"` | `"cottage cheese"` |
| `"scant ½ teaspoon salt"` | `"scant ½ teaspoon"` | `"salt"` |
| `"6 large eggs"` | `"6"` | `"large eggs"` |
| `"2 tablespoons olive oil"` | `"2 tablespoons"` | `"olive oil"` |

### Skipped Ingredients

Ingredients without parseable quantities are automatically skipped and added to `ingredientsNotFound`:

- `"Salt and pepper to taste"` - No specific quantity
- `"Fresh basil for garnish"` - No measurable amount
- `"Olive oil for drizzling"` - Unspecified quantity

This ensures more accurate nutrition calculations by excluding unmeasured ingredients.

## Use Cases

### Per-Serving Nutrition Display

Use the `nutrition` array to display nutrition facts per serving on recipe cards:

```javascript
const perServing = response.data.nutrition
const calories = perServing.find(n => n.id === 'calories').amount
// Display: "250 calories per serving"
```

### Total Recipe Nutrition

Use the `totalNutrition` array for:

- **Batch Cooking**: Calculate nutrition for entire batch
- **Meal Prep**: Plan weekly nutrition intake
- **Recipe Scaling**: Adjust nutrition when scaling recipes
- **Verification**: Validate per-serving calculations

```javascript
const total = response.data.totalNutrition
const totalCalories = total.find(n => n.id === 'calories').amount
// Display: "1000 total calories (4 servings)"
```

## Implementation Details

### API Provider

This endpoint uses [API Ninjas /v1/nutritionitem](https://api-ninjas.com/api/nutrition) which:

- Accepts explicit `query` (food item) and `quantity` parameters
- Returns nutrition data scaled to the specified quantity
- Natively supports unicode fractions
- Provides detailed nutritional breakdown per ingredient

### Processing Flow

1. **Parse or Use Pre-populated Data**: Prioritizes `item`/`amount` properties, falls back to parsing `original_text`
2. **Filter Valid Ingredients**: Skips ingredients without parseable quantities
3. **Parallel API Calls**: Fetches nutrition for all valid ingredients simultaneously
4. **Aggregate Results**: Sums nutrition values across all ingredients
5. **Calculate Per-Serving**: Divides totals by number of servings
6. **Return Both**: Provides both per-serving and total nutrition

### Performance

- **Parallel Processing**: Uses `Promise.all()` for concurrent API requests
- **Fast Response**: Multiple ingredients processed simultaneously
- **Efficient Caching**: API Ninjas provides built-in caching

## Example Usage

### cURL

```bash
curl -X POST https://your-domain.com/api/v1/nutrition/recipe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Chocolate Chip Cookies",
    "yield": 24,
    "ingredients": [
      {"original_text": "2¼ cups all-purpose flour"},
      {"original_text": "1 teaspoon baking soda"},
      {"original_text": "1 cup butter, softened"},
      {"original_text": "¾ cup granulated sugar"},
      {"original_text": "2 large eggs"},
      {"original_text": "2 cups chocolate chips"}
    ],
    "nutrition": [
      {"id": "number_of_servings", "amount": "24"},
      {"id": "calories"},
      {"id": "total_fat"},
      {"id": "protein"},
      {"id": "carbohydrates"}
    ]
  }'
```

### JavaScript (Fetch)

```javascript
const response = await fetch('/api/v1/nutrition/recipe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Chocolate Chip Cookies',
    yield: 24,
    ingredients: [
      { original_text: '2¼ cups all-purpose flour' },
      { original_text: '1 teaspoon baking soda' },
      { original_text: '1 cup butter, softened' },
      { original_text: '¾ cup granulated sugar' },
      { original_text: '2 large eggs' },
      { original_text: '2 cups chocolate chips' }
    ],
    nutrition: [
      { id: 'number_of_servings', amount: '24' },
      { id: 'calories' },
      { id: 'total_fat' },
      { id: 'protein' },
      { id: 'carbohydrates' }
    ]
  })
})

const data = await response.json()
console.log('Per cookie:', data.data.nutrition)
console.log('Total batch:', data.data.totalNutrition)
```

## Best Practices

### 1. Pre-populate When Possible

For best accuracy, provide pre-parsed `item` and `amount` properties:

```json
{
  "original_text": "1 cup all-purpose flour",
  "item": "all-purpose flour",
  "amount": "1 cup"
}
```

### 2. Handle Skipped Ingredients

Check `ingredientsNotFound` and inform users which ingredients weren't included:

```javascript
if (data.data.ingredientsNotFound.length > 0) {
  console.log('These ingredients were not included in calculations:')
  data.data.ingredientsNotFound.forEach(ing => console.log(`- ${ing}`))
}
```

### 3. Specify Servings Clearly

Always include `number_of_servings` in the nutrition array for accurate per-serving calculations:

```json
{
  "nutrition": [
    { "id": "number_of_servings", "amount": "4" },
    // ... other fields
  ]
}
```

### 4. Use Specific Ingredient Names

More specific ingredient names yield better results:

- ✅ `"all-purpose flour"` instead of `"flour"`
- ✅ `"extra virgin olive oil"` instead of `"oil"`
- ✅ `"sharp cheddar cheese"` instead of `"cheese"`

## Notes

- Nutrition data may vary slightly based on ingredient brands and types
- Values are rounded to 2 decimal places
- Trans fat is set to 0 (not provided by API Ninjas)
- Unsaturated fat is calculated as `total_fat - saturated_fat`
- Net carbs is calculated as `carbohydrates - fiber`

::callout{type="warning" title="API Limitations"}
Some fields like `calories`, `protein_g`, and `serving_size_g` may return premium-only messages if using a free API Ninjas account. In this case, those values will be set to 0.
::
