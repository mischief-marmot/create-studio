/**
 * TypeScript interfaces for Schema.org structured data
 * Supporting Recipe, HowTo, FAQ, and List schemas with shared components
 */

// Base interfaces
export interface ImageObject {
  '@type': 'ImageObject'
  url: string
  width?: number
  height?: number
  caption?: string
}

export interface Person {
  '@type': 'Person'
  name: string
  url?: string
}

export interface Organization {
  '@type': 'Organization'
  name: string
  url?: string
  logo?: ImageObject
}

export interface Rating {
  '@type': 'AggregateRating'
  ratingValue: number
  bestRating?: number
  worstRating?: number
  ratingCount: number
}

export interface Review {
  '@type': 'Review'
  author: Person | Organization
  datePublished?: string
  reviewBody: string
  reviewRating: {
    '@type': 'Rating'
    ratingValue: number
    bestRating?: number
    worstRating?: number
  }
  name?: string
}

export interface NutritionInformation {
  '@type': 'NutritionInformation'
  calories?: string
  carbohydrateContent?: string
  cholesterolContent?: string
  fatContent?: string
  fiberContent?: string
  proteinContent?: string
  saturatedFatContent?: string
  servingSize?: string
  sodiumContent?: string
  sugarContent?: string
  transFatContent?: string
  unsaturatedFatContent?: string
}

// Shared components between Recipe and HowTo
export interface Supply {
  '@type': 'HowToSupply'
  name: string
  quantity?: number
  unit?: string
}

export interface Tool {
  '@type': 'HowToTool'
  name: string
  requiredQuantity?: number
}

export interface Step {
  '@type': 'HowToStep'
  name?: string
  text: string
  url?: string
  image?: ImageObject
}

// Recipe instruction section (groups steps together)
export interface HowToSection {
  '@type': 'HowToSection'
  name?: string
  itemListElement: Step[]
}

// Recipe instruction can be either a Step or a HowToSection
export type RecipeInstruction = Step | HowToSection

// Recipe Schema (Schema.org standard format)
export interface Recipe {
  '@context': 'https://schema.org'
  '@type': 'Recipe'
  name: string
  description: string
  image: string | string[]
  author: Person | Organization
  datePublished?: string
  prepTime?: string // ISO 8601 duration format
  cookTime?: string // ISO 8601 duration format
  totalTime?: string // ISO 8601 duration format
  recipeCategory?: string[]
  recipeCuisine?: string[]
  recipeYield?: string[] // e.g., ["4", "4 servings"]
  recipeIngredient: string[] // Standard Schema.org format for ingredients
  recipeInstructions: RecipeInstruction[] // Can be Steps or HowToSections
  aggregateRating?: Rating
  review?: Review[]
  nutrition?: NutritionInformation
  keywords?: string
  '@id'?: string
  isPartOf?: { '@id': string }
  mainEntityOfPage?: string
  video?: {
    '@type': 'VideoObject'
    name: string
    description: string
    thumbnailUrl: string
    contentUrl: string
    embedUrl?: string
    uploadDate?: string
    duration?: string
  }
}

// HowTo Schema (shares supplies, tools, steps with Recipe)
export interface HowTo {
  '@context': 'https://schema.org'
  '@type': 'HowTo'
  name: string
  description: string
  image?: string | ImageObject | ImageObject[]
  estimatedCost?: {
    '@type': 'MonetaryAmount'
    currency: string
    value: number
  }
  supply?: Supply[] // Shared with Recipe
  tool?: Tool[] // Shared with Recipe
  step: Step[] // Shared with Recipe
  totalTime?: string // ISO 8601 duration format
  performTime?: string // ISO 8601 duration format
  prepTime?: string // ISO 8601 duration format
}

// FAQ Schema (simplified from FAQPage)
export interface Question {
  '@type': 'Question'
  name: string
  acceptedAnswer: {
    '@type': 'Answer'
    text: string
  }
}

export interface FAQ {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  name?: string
  description?: string
  mainEntity: Question[]
}

// List Schema
export interface ListItem {
  '@type': 'ListItem'
  position: number
  name?: string
  description?: string
  image?: ImageObject
  url?: string
}

export interface ItemList {
  '@context': 'https://schema.org'
  '@type': 'ItemList'
  name: string
  description?: string
  numberOfItems?: number
  itemListOrder?: 'ascending' | 'descending' | 'unordered'
  itemListElement: ListItem[]
}

// Union type for all supported schemas
export type StructuredDataSchema = Recipe | HowTo | FAQ | ItemList

// Form data interfaces (for internal use)
export interface RecipeFormData {
  name: string
  description: string
  image?: File | string
  author: string
  authorType: 'Person' | 'Organization'
  authorUrl?: string
  prepTime?: string
  cookTime?: string
  yield?: string // Number of servings/portions (e.g., "4")
  yieldDescription?: string // Description of yield (e.g., "4 servings")
  category?: string[]
  cuisine?: string[]
  ingredients: string[] // Standard Schema.org format - array of ingredient strings
  instructions: Array<{
    section?: string // Optional section name (e.g., "Make the Dough")
    name?: string
    step: string
    image?: File | string
  }>
  reviews?: Array<{
    author: string
    authorType: 'Person' | 'Organization'
    rating: number
    reviewText: string
    reviewTitle?: string
    datePublished?: string
  }>
  nutrition?: Partial<NutritionInformation>
  keywords?: string
}

export interface HowToFormData {
  name: string
  description: string
  image?: File | string
  estimatedCost?: number
  currency?: string
  supplies?: Array<{
    name: string
    quantity?: number
    unit?: string
  }>
  tools?: Array<{
    name: string
    quantity?: number
  }>
  steps: Array<{
    name?: string
    instruction: string
    image?: File | string
  }>
  totalTime?: string
  performTime?: string
  prepTime?: string
}

export interface FAQFormData {
  name?: string
  description?: string
  questions: Array<{
    question: string
    answer: string
  }>
}

export interface ListFormData {
  name: string
  description?: string
  itemListOrder?: 'ascending' | 'descending' | 'unordered'
  items: Array<{
    name?: string
    description?: string
    image?: File | string
    url?: string
  }>
}

export type FormData = RecipeFormData | HowToFormData | FAQFormData | ListFormData