import type { HowTo, HowToStep, ImageObject } from '~/types/schema-org'
import { parseTimerFromText } from './timerLabels'
import { useLogger } from '@create-studio/shared/utils/logger'

const config = useRuntimeConfig()
const logger = useLogger('TransformCreation', config.debug)

interface WPCreationResponse {
  id: number
  title: string
  author?: string
  description?: string
  instructions: string
  instructions_with_ads?: string
  notes?: string
  thumbnail_uri?: string
  thumbnail_id?: string
  prep_time?: string
  active_time?: string
  additional_time?: string
  total_time?: string
  yield?: string
  difficulty?: string
  estimated_cost?: string
  rating?: string
  rating_count?: string
  nutrition?: any[]
  supplies?: any[]
  products?: any[]
  category_name?: string
  keywords?: string
  created?: string
  modified?: string
  unit_conversions?: {
    enabled: boolean
    default_system: 'auto' | 'us_customary' | 'metric'
    source_system: 'us_customary' | 'metric'
    label: string
    conversions: Record<string, { amount: string; unit: string; max_amount?: string | null }>
  }
}

interface WPMediaResponse {
  id: number
  source_url: string
  media_details?: {
    width: number
    height: number
    sizes?: {
      full?: {
        source_url: string
      }
      large?: {
        source_url: string
      }
      medium?: {
        source_url: string
      }
    }
  }
  alt_text?: string
  caption?: {
    rendered: string
  }
}

export async function transformCreationToHowTo(
  creation: WPCreationResponse,
  siteUrl: string
): Promise<HowTo> {
  const startTime = performance.now()
  // Parse instructions HTML to extract steps and image IDs
  const { steps, stepImageMap } = parseInstructions(creation.instructions)

  // Get unique image IDs to fetch
  const imageIds = Array.from(stepImageMap.values())
  logger.info(`${(performance.now() - startTime).toFixed(2)}ms Fetching ${imageIds.length} images`)

  // Fetch all images in parallel
  const images = await fetchImages(imageIds, siteUrl)
  console.info(`${(performance.now() - startTime).toFixed(2)}ms Fetched ${imageIds.length} images`)
  
  // Map images to steps based on the step-image mapping
  const stepsWithImages = mapImagesToSteps(steps, images, stepImageMap)
  
  // Parse ingredients from description or a dedicated field
  const ingredients = parseIngredients(creation)
  const ingredientsWithGroups = parseIngredientsWithGroups(creation)

  // Build the HowTo object
  const howTo: HowTo = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: creation.title || 'Recipe',
    description: cleanHtml(creation.description || ''),
    datePublished: creation.created || new Date().toISOString(),
    dateModified: creation.modified || new Date().toISOString(),
    difficulty: mapDifficulty(creation.difficulty),
    interactiveMode: true,
    step: stepsWithImages,
    recipeIngredient: ingredients,
    recipeIngredientGroups: ingredientsWithGroups, // Add grouped ingredients
    supply: ingredients.map(ing => ({
      '@type': 'HowToSupply' as const,
      name: ing
    }))
  }
  
  // Add optional fields
  if (creation.thumbnail_uri) {
    howTo.image = {
      '@type': 'ImageObject',
      url: creation.thumbnail_uri
    }
  }
  
  if (creation.author) {
    howTo.author = {
      '@type': 'Person',
      name: creation.author
    }
  }
  
  if (creation.prep_time) {
    howTo.prepTime = `PT${creation.prep_time}M`
  }
  
  if (creation.active_time) {
    howTo.cookTime = `PT${creation.active_time}M`
  }
  
  if (creation.total_time) {
    howTo.totalTime = `PT${creation.total_time}M`
  }
  
  if (creation.yield) {
    howTo.yield = creation.yield
  }
  
  if (creation.keywords) {
    howTo.keywords = creation.keywords
  }
  
  if (creation.rating && creation.rating_count) {
    howTo.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(creation.rating),
      ratingCount: parseInt(creation.rating_count)
    }
  }
  
  if (creation.nutrition && creation.nutrition.length > 0) {
    // Process nutrition data if available
    howTo.nutrition = processNutrition(creation.nutrition)
  }

  if (creation.unit_conversions && creation.unit_conversions.enabled) {
    howTo.unitConversions = creation.unit_conversions
  }
  
  const totalTime = performance.now() - startTime
  logger.info(`${totalTime.toFixed(2)}ms Total transform time`)
  return howTo
}

function parseInstructions(instructionsHtml: string): {
  steps: HowToStep[]
  stepImageMap: Map<number, number> // Maps step index to image ID
} {
  const stepImageMap = new Map<number, number>()
  const steps: HowToStep[] = []

  // Extract list items using regex (works in server environment)
  const listItemRegex = /<li[^>]*>(.*?)<\/li>/gis
  const matches = Array.from(instructionsHtml.matchAll(listItemRegex))

  if (matches.length > 0) {
    // Process list items
    matches.forEach((match, index) => {
      const itemContent = match[1]

      // Extract image shortcode BEFORE removing HTML tags
      const { text: textWithoutShortcode, imageId } = extractImageFromText(itemContent)
      if (imageId) {
        stepImageMap.set(index, imageId) // Map this step index to its image ID
      }

      // Extract links BEFORE removing HTML tags
      const links = extractLinksFromHtml(textWithoutShortcode)

      // Now remove HTML tags from the text that has shortcode already removed
      const cleanText = textWithoutShortcode.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

      const step: HowToStep = {
        '@type': 'HowToStep',
        text: cleanText,
        position: index + 1
      }

      // Add links if any were found
      if (links.length > 0) {
        step.links = links
      }

      // Parse timer from text using enhanced detection
      const timerInfo = parseTimerFromText(cleanText)
      if (timerInfo && timerInfo.duration) {
        step.timer = {
          duration: timerInfo.duration,
          label: `${timerInfo.label} ${formatTimerDuration(timerInfo.duration)}`,
          autoStart: false
        }
      }

      steps.push(step)
    })
  } else {
    // Fallback: split by common delimiters if no list structure
    const lines = instructionsHtml
      .replace(/<[^>]*>/g, '\n')
      .split(/\n+/)
      .filter(line => line.trim())

    lines.forEach((line, index) => {
      const { text, imageId } = extractImageFromText(line)
      if (imageId) {
        stepImageMap.set(index, imageId) // Map this step index to its image ID
      }

      const step: HowToStep = {
        '@type': 'HowToStep',
        text: text.trim(),
        position: index + 1
      }

      // Parse timer from text using enhanced detection
      const timerInfo = parseTimerFromText(text)
      if (timerInfo && timerInfo.duration) {
        step.timer = {
          duration: timerInfo.duration,
          label: `${timerInfo.label} ${formatTimerDuration(timerInfo.duration)}`,
          autoStart: false
        }
      }

      steps.push(step)
    })
  }

  return { steps, stepImageMap }
}

// Extract links from HTML content
function extractLinksFromHtml(html: string): { text: string; href: string; target?: string; rel?: string }[] {
  const links: { text: string; href: string; target?: string; rel?: string }[] = []

  // Match anchor tags with their attributes and content
  const linkRegex = /<a\s+([^>]*)>(.*?)<\/a>/gi
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    const attributes = match[1]
    const linkText = match[2].replace(/<[^>]*>/g, '').trim() // Remove any nested tags

    // Extract href
    const hrefMatch = attributes.match(/href=["']([^"']*)["']/i)
    if (hrefMatch) {
      const link: { text: string; href: string; target?: string; rel?: string } = {
        text: linkText,
        href: hrefMatch[1]
      }

      // Extract target if present
      const targetMatch = attributes.match(/target=["']([^"']*)["']/i)
      if (targetMatch) {
        link.target = targetMatch[1]
      }

      // Extract rel if present
      const relMatch = attributes.match(/rel=["']([^"']*)["']/i)
      if (relMatch) {
        link.rel = relMatch[1]
      }

      links.push(link)
    }
  }

  return links
}

function extractImageFromText(text: string): {
  text: string
  imageId: number | null
} {
  // Extract [mv_img id="XX"] or [mv_img id=&quot;XX&quot;] pattern
  const imageMatch = text.match(/\[mv_img\s+id=(?:"|&quot;)(\d+)(?:"|&quot;)\]/i)
  if (imageMatch) {
    const imageId = parseInt(imageMatch[1])
    const cleanText = text.replace(imageMatch[0], '').trim()
    return { text: cleanText, imageId }
  }
  return { text, imageId: null }
}

async function fetchImages(
  imageIds: number[],
  siteUrl: string
): Promise<Map<number, ImageObject>> {
  const images = new Map<number, ImageObject>()
  
  // Fetch all images in parallel
  const promises = imageIds.map(async (id) => {
    try {
      const response = await $fetch<WPMediaResponse>(
        `${siteUrl}/wp-json/wp/v2/media/${id}`
      )
      
      const imageUrl = response.source_url || 
        response.media_details?.sizes?.full?.source_url ||
        response.media_details?.sizes?.large?.source_url ||
        response.media_details?.sizes?.medium?.source_url ||
        ''
        
      if (imageUrl) {
        const imageObj = {
          '@type': 'ImageObject' as const,
          url: imageUrl,
          caption: response.alt_text || response.caption?.rendered
        }
        images.set(id, imageObj)
      }
    } catch (error) {
      console.error(`Failed to fetch image ${id}:`, error)
    }
  })
  
  await Promise.all(promises)
  return images
}

function mapImagesToSteps(
  steps: HowToStep[],
  images: Map<number, ImageObject>,
  stepImageMap: Map<number, number>
): HowToStep[] {
  
  return steps.map((step, index) => {
    // Check if this step has an associated image ID
    const imageId = stepImageMap.get(index)
    if (imageId && images.has(imageId)) {
      step.image = images.get(imageId)
    }
    return step
  })
}

function formatTimerDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m} minutes`
  return `${s} seconds`
}


function parseIngredients(creation: WPCreationResponse): (string | import('~/types/schema-org').RecipeIngredient)[] {
  const ingredients: (string | import('~/types/schema-org').RecipeIngredient)[] = []

  // Get ingredients from the supplies array
  if (creation.supplies && Array.isArray(creation.supplies) && creation.supplies.length > 0) {
    creation.supplies.forEach((supply: any) => {
      if (supply.original_text) {
        // If there's a link, preserve it as an object
        if (supply.link) {
          ingredients.push({
            original_text: supply.original_text,
            link: supply.link,
            nofollow: supply.nofollow || false
          })
        } else {
          // Otherwise just use the text
          ingredients.push(supply.original_text)
        }
      } else if (supply.title || supply.name) {
        ingredients.push(supply.title || supply.name)
      }
    })
  }

  return ingredients
}

// Parse ingredients with their groups preserved
function parseIngredientsWithGroups(creation: WPCreationResponse): Record<string, (string | import('~/types/schema-org').RecipeIngredient)[]> {
  const groups: Record<string, (string | import('~/types/schema-org').RecipeIngredient)[]> = {}

  // Get ingredients from the supplies array
  if (creation.supplies && Array.isArray(creation.supplies) && creation.supplies.length > 0) {
    creation.supplies.forEach((supply: any) => {
      const groupName = supply.group || '' // Empty string for ungrouped items
      const ingredientText = supply.original_text || supply.title || supply.name

      if (ingredientText) {
        if (!groups[groupName]) {
          groups[groupName] = []
        }

        // If there's a link, preserve it as an object
        if (supply.link) {
          groups[groupName].push({
            original_text: ingredientText,
            link: supply.link,
            nofollow: supply.nofollow || false
          })
        } else {
          // Otherwise just use the text
          groups[groupName].push(ingredientText)
        }
      }
    })
  }

  return groups
}

function cleanHtml(html: string): string {
  // Remove HTML tags but preserve text
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function mapDifficulty(difficulty?: string): 'easy' | 'medium' | 'hard' {
  const lower = difficulty?.toLowerCase()
  if (lower?.includes('easy')) return 'easy'
  if (lower?.includes('hard') || lower?.includes('difficult')) return 'hard'
  return 'medium'
}

function processNutrition(nutritionData: any[]): HowTo['nutrition'] {
  // Process nutrition data based on WordPress structure
  // This is a placeholder - adjust based on actual data format
  return {
    '@type': 'NutritionInformation'
  }
}