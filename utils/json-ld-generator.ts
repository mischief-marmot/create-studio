/**
 * JSON-LD Generator Utilities
 * Converts form data to valid Schema.org JSON-LD structured data
 */

import type {
  Recipe,
  HowTo,
  FAQ,
  ItemList,
  RecipeFormData,
  HowToFormData,
  FAQFormData,
  ListFormData,
  StructuredDataSchema,
  ImageObject,
  Person,
  Organization,
  Supply,
  Tool,
  Step,
  HowToSection,
  RecipeInstruction,
  Question,
  ListItem,
  Review
} from '~/types/schemas'

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Format duration in minutes to ISO 8601 duration format
 */
export function formatDuration(minutes: number | string | undefined): string | undefined {
  if (minutes === undefined || minutes === '' || minutes === null) {
    return undefined
  }

  const numMinutes = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes
  
  if (isNaN(numMinutes) || numMinutes < 0) {
    return undefined
  }

  if (numMinutes === 0) {
    return 'PT0M'
  }

  const hours = Math.floor(numMinutes / 60)
  const remainingMinutes = numMinutes % 60

  if (hours > 0 && remainingMinutes > 0) {
    return `PT${hours}H${remainingMinutes}M`
  } else if (hours > 0) {
    return `PT${hours}H`
  } else {
    return `PT${remainingMinutes}M`
  }
}

/**
 * Format image to ImageObject or return URL string
 */
export function formatImageObject(image: File | string | undefined, asObject: boolean = true): ImageObject | string | undefined {
  if (!image) {
    return undefined
  }

  const url = typeof image === 'string' ? image : image.name

  if (asObject) {
    return {
      '@type': 'ImageObject',
      url
    }
  }

  return url
}

/**
 * Create author object from form data
 */
function createAuthor(author: string, authorType: 'Person' | 'Organization', authorUrl?: string): Person | Organization {
  const baseAuthor = {
    '@type': authorType,
    name: author
  } as Person | Organization

  if (authorUrl) {
    baseAuthor.url = authorUrl
  }

  return baseAuthor
}

/**
 * Convert supplies form data to Supply objects
 */
function createSupplies(supplies: Array<{ name: string; quantity?: number; unit?: string }>): Supply[] {
  return supplies.map(supply => ({
    '@type': 'HowToSupply',
    name: supply.name,
    ...(supply.quantity && { quantity: supply.quantity }),
    ...(supply.unit && { unit: supply.unit })
  }))
}

/**
 * Convert tools form data to Tool objects
 */
function createTools(tools: Array<{ name: string; quantity?: number }>): Tool[] {
  return tools.map(tool => ({
    '@type': 'HowToTool',
    name: tool.name,
    ...(tool.quantity && { requiredQuantity: tool.quantity })
  }))
}

/**
 * Convert instructions form data to Step objects
 */
function createSteps(instructions: Array<{ name?: string; step?: string; instruction?: string; image?: File | string }>): Step[] {
  return instructions.map(instruction => ({
    '@type': 'HowToStep',
    ...(instruction.name && { name: instruction.name }),
    text: instruction.step || instruction.instruction || '',
    ...(instruction.image && { image: formatImageObject(instruction.image) as ImageObject })
  }))
}

/**
 * Convert recipe instructions form data to RecipeInstruction objects (Steps or HowToSections)
 */
function createRecipeInstructions(instructions: Array<{ section?: string; name?: string; step: string; image?: File | string }>): RecipeInstruction[] {
  // Group instructions by section
  const sectionMap = new Map<string, Step[]>()
  const ungroupedSteps: Step[] = []

  instructions.forEach(instruction => {
    const step: Step = {
      '@type': 'HowToStep',
      ...(instruction.name && { name: instruction.name }),
      text: instruction.step,
      ...(instruction.image && { image: formatImageObject(instruction.image) as ImageObject })
    }

    if (instruction.section) {
      if (!sectionMap.has(instruction.section)) {
        sectionMap.set(instruction.section, [])
      }
      sectionMap.get(instruction.section)!.push(step)
    } else {
      ungroupedSteps.push(step)
    }
  })

  const result: RecipeInstruction[] = []

  // Add grouped sections
  sectionMap.forEach((steps, sectionName) => {
    result.push({
      '@type': 'HowToSection',
      name: sectionName,
      itemListElement: steps
    })
  })

  // Add ungrouped steps
  result.push(...ungroupedSteps)

  return result
}

/**
 * Convert reviews form data to Review objects
 */
function createReviews(reviews: Array<{ author: string; authorType: 'Person' | 'Organization'; rating: number; reviewText: string; reviewTitle?: string; datePublished?: string }>): Review[] {
  return reviews.map(review => ({
    '@type': 'Review',
    author: createAuthor(review.author, review.authorType),
    reviewBody: review.reviewText,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    ...(review.reviewTitle && { name: review.reviewTitle }),
    ...(review.datePublished && { datePublished: review.datePublished })
  }))
}

/**
 * Generate Recipe JSON-LD from form data
 */
export function generateRecipeJsonLd(formData: RecipeFormData): Recipe {
  const prepTime = formatDuration(formData.prepTime)
  const cookTime = formatDuration(formData.cookTime)
  
  // Calculate total time if both prep and cook times are available
  let totalTime: string | undefined
  if (prepTime && cookTime) {
    const prepMinutes = formData.prepTime ? parseInt(formData.prepTime.toString(), 10) : 0
    const cookMinutes = formData.cookTime ? parseInt(formData.cookTime.toString(), 10) : 0
    totalTime = formatDuration(prepMinutes + cookMinutes)
  }

  // Create recipeYield array format
  let recipeYield: string[] | undefined
  if (formData.yield) {
    recipeYield = [formData.yield]
    if (formData.yieldDescription && formData.yieldDescription !== formData.yield) {
      recipeYield.push(formData.yieldDescription)
    }
  }

  // Convert image to string array format if needed
  let imageValue: string | string[] | undefined
  if (formData.image) {
    const imageUrl = typeof formData.image === 'string' ? formData.image : formData.image.name
    imageValue = [imageUrl]
  }

  const recipe: Recipe = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: formData.name,
    description: formData.description,
    ...(imageValue && { image: imageValue }),
    author: createAuthor(formData.author, formData.authorType, formData.authorUrl),
    recipeIngredient: formData.ingredients,
    recipeInstructions: createRecipeInstructions(formData.instructions),
    ...(recipeYield && { recipeYield }),
    ...(formData.category && { recipeCategory: formData.category }),
    ...(formData.cuisine && { recipeCuisine: formData.cuisine }),
    ...(prepTime && { prepTime }),
    ...(cookTime && { cookTime }),
    ...(totalTime && { totalTime }),
    ...(formData.reviews && formData.reviews.length > 0 && { review: createReviews(formData.reviews) }),
    ...(formData.nutrition && { nutrition: { '@type': 'NutritionInformation', ...formData.nutrition } }),
    ...(formData.keywords && { keywords: formData.keywords })
  }

  return recipe
}

/**
 * Generate HowTo JSON-LD from form data
 */
export function generateHowToJsonLd(formData: HowToFormData): HowTo {
  const howTo: HowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: formData.name,
    description: formData.description,
    step: createSteps(formData.steps),
    ...(formData.image && { image: formatImageObject(formData.image, false) as string }),
    ...(formData.estimatedCost && formData.currency && {
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: formData.currency,
        value: formData.estimatedCost
      }
    }),
    ...(formData.supplies && formData.supplies.length > 0 && { supply: createSupplies(formData.supplies) }),
    ...(formData.tools && formData.tools.length > 0 && { tool: createTools(formData.tools) }),
    ...(formData.totalTime && { totalTime: formatDuration(formData.totalTime) }),
    ...(formData.performTime && { performTime: formatDuration(formData.performTime) }),
    ...(formData.prepTime && { prepTime: formatDuration(formData.prepTime) })
  }

  return howTo
}

/**
 * Generate FAQ JSON-LD from form data
 */
export function generateFAQJsonLd(formData: FAQFormData): FAQ {
  const questions: Question[] = formData.questions.map(q => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q.answer
    }
  }))

  const faq: FAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions,
    ...(formData.name && { name: formData.name }),
    ...(formData.description && { description: formData.description })
  }

  return faq
}

/**
 * Generate ItemList JSON-LD from form data
 */
export function generateListJsonLd(formData: ListFormData): ItemList {
  const listItems: ListItem[] = formData.items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.image && { image: formatImageObject(item.image) as ImageObject }),
    ...(item.url && { url: item.url })
  }))

  const itemList: ItemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: formData.name,
    itemListElement: listItems,
    numberOfItems: formData.items.length,
    ...(formData.description && { description: formData.description }),
    ...(formData.itemListOrder && { itemListOrder: formData.itemListOrder })
  }

  return itemList
}

/**
 * Validate JSON-LD structured data
 */
export function validateJsonLd(jsonLd: StructuredDataSchema): ValidationResult {
  const errors: string[] = []

  // Check required @context and @type
  if (!jsonLd['@context']) {
    errors.push('Missing required field: @context')
  }
  if (!jsonLd['@type']) {
    errors.push('Missing required field: @type')
  }

  // Type-specific validation
  switch (jsonLd['@type']) {
    case 'Recipe':
      validateRecipe(jsonLd as Recipe, errors)
      break
    case 'HowTo':
      validateHowTo(jsonLd as HowTo, errors)
      break
    case 'FAQPage':
      validateFAQ(jsonLd as FAQ, errors)
      break
    case 'ItemList':
      validateItemList(jsonLd as ItemList, errors)
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate Recipe schema
 */
function validateRecipe(recipe: Recipe, errors: string[]): void {
  const requiredFields = ['name', 'description', 'author', 'recipeIngredient', 'recipeInstructions']
  
  requiredFields.forEach(field => {
    if (!recipe[field as keyof Recipe]) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  // Validate ingredients array
  if (recipe.recipeIngredient && (!Array.isArray(recipe.recipeIngredient) || recipe.recipeIngredient.length === 0)) {
    errors.push('recipeIngredient must be a non-empty array')
  }

  // Validate instructions array
  if (recipe.recipeInstructions && (!Array.isArray(recipe.recipeInstructions) || recipe.recipeInstructions.length === 0)) {
    errors.push('recipeInstructions must be a non-empty array')
  }

  // Validate duration formats
  if (recipe.prepTime && !isValidDuration(recipe.prepTime)) {
    errors.push('Invalid duration format: prepTime')
  }
  if (recipe.cookTime && !isValidDuration(recipe.cookTime)) {
    errors.push('Invalid duration format: cookTime')
  }
  if (recipe.totalTime && !isValidDuration(recipe.totalTime)) {
    errors.push('Invalid duration format: totalTime')
  }
}

/**
 * Validate HowTo schema
 */
function validateHowTo(howTo: HowTo, errors: string[]): void {
  const requiredFields = ['name', 'description', 'step']
  
  requiredFields.forEach(field => {
    if (!howTo[field as keyof HowTo]) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  // Validate duration formats
  if (howTo.totalTime && !isValidDuration(howTo.totalTime)) {
    errors.push('Invalid duration format: totalTime')
  }
  if (howTo.performTime && !isValidDuration(howTo.performTime)) {
    errors.push('Invalid duration format: performTime')
  }
  if (howTo.prepTime && !isValidDuration(howTo.prepTime)) {
    errors.push('Invalid duration format: prepTime')
  }
}

/**
 * Validate FAQ schema
 */
function validateFAQ(faq: FAQ, errors: string[]): void {
  if (!faq.mainEntity || faq.mainEntity.length === 0) {
    errors.push('Missing required field: mainEntity')
  }
}

/**
 * Validate ItemList schema
 */
function validateItemList(itemList: ItemList, errors: string[]): void {
  const requiredFields = ['name', 'itemListElement']
  
  requiredFields.forEach(field => {
    if (!itemList[field as keyof ItemList]) {
      errors.push(`Missing required field: ${field}`)
    }
  })
}

/**
 * Check if duration string is in valid ISO 8601 format
 */
function isValidDuration(duration: string): boolean {
  const durationRegex = /^PT(\d+H)?(\d+M)?(\d+S)?$/
  return durationRegex.test(duration)
}