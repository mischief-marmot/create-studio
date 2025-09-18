<template>
  <div class="cs-servings-adjuster">
    <div class="cs-servings-adjuster-inner">
      <span class="cs-servings-adjuster-label">Adjust Servings:</span>
      <div class="cs-servings-adjuster-buttons" role="group" aria-label="Adjust servings">
        <button 
          v-for="multiplier in availableMultipliers" 
          :key="multiplier"
          class="cs-servings-adjuster-btn"
          :class="{ active: currentMultiplier === multiplier }"
          :data-multiplier="multiplier"
          :aria-pressed="currentMultiplier === multiplier"
          @click="handleMultiplierChange(multiplier)"
        >
          {{ multiplier }}x
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, nextTick } from 'vue'
import { SharedStorageManager } from '#shared/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '#shared/utils/domain'

interface Props {
  config: {
    creationId: string
    creationName?: string
    defaultMultiplier?: number
    siteUrl?: string
    theme?: Record<string, string>
  }
  storage?: any
}

const props = defineProps<Props>()

const globalConfig = inject<any>('widgetConfig')
const storageManager = new SharedStorageManager()

const currentMultiplier = ref(1)
const availableMultipliers = [1, 2, 3]
const originalAmounts = new Map<number, { text: string; amount: string | null }>()
const originalYield = ref<string | null>(null)

// Get the card element that contains this widget
const cardElement = computed(() => {
  const creationId = props.config.creationId
  return document.querySelector(`section[id^="mv-creation-${creationId}"]`) as HTMLElement
})

// Create creation key for storage
const creationKey = computed(() => {
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  return createCreationKey(domain, props.config.creationId)
})

onMounted(() => {
  initializeWidget()
})

async function initializeWidget() {
  if (!cardElement.value) {
    return
  }

  // Initialize creation in shared storage
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  storageManager.initializeCreation(domain, props.config.creationId)

  // Load saved multiplier or use default
  const savedMultiplier = storageManager.getServingsMultiplier(creationKey.value)
  const defaultMultiplier = props.config.defaultMultiplier || 
    parseInt(cardElement.value.dataset.servingsAdjustment || '1')
  
  currentMultiplier.value = savedMultiplier || defaultMultiplier

  await nextTick()
  
  // Store original amounts and yield
  storeOriginalData()
  
  // Apply current multiplier if not 1x
  if (currentMultiplier.value !== 1) {
    updateYield()
    updateIngredients()
  }
}

function storeOriginalData() {
  if (!cardElement.value) return

  // Store original yield
  storeOriginalYield()
  
  // Store original ingredient amounts
  storeOriginalAmounts()
}

function storeOriginalYield() {
  if (!cardElement.value) return

  // Find the yield element - try multiple possible locations
  let yieldElement = cardElement.value.querySelector('.mv-create-time-yield .mv-create-time-format') ||
                    cardElement.value.querySelector('.mv-create-yield') ||
                    cardElement.value.querySelector('.mv-create-nutrition-yield')
  
  if (yieldElement) {
    originalYield.value = yieldElement.textContent?.trim() || null
  }
}

function storeOriginalAmounts() {
  if (!cardElement.value) return

  const ingredients = cardElement.value.querySelectorAll('.mv-create-ingredients li')
  ingredients.forEach((ingredient, index) => {
    const text = ingredient.textContent?.trim() || ''
    const amountData = (ingredient as HTMLElement).dataset.ingredientAmount
    
    
    // Always prefer the data attribute if it exists
    let amount = amountData
    if (!amount) {
      // Only try to extract from text if no data attribute
      amount = extractAmount(text)
    }
    
    originalAmounts.set(index, {
      text: text,
      amount: amount
    })
  })
}

function extractAmount(text: string): string | null {
  // Extract numeric amounts from ingredient text
  // Matches patterns like: "2 1/4 cups", "1/2 teaspoon", "1-2 tablespoons", "1.5 oz"
  const patterns = [
    /^(\d+\s+\d+\/\d+)\s+/, // Mixed fractions like "2 1/4" or "1 1/2"
    /^(\d+\/\d+)\s+/, // Simple fractions like "1/2" or "3/4"
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

function handleMultiplierChange(newMultiplier: number) {
  if (newMultiplier === currentMultiplier.value) return

  currentMultiplier.value = newMultiplier
  
  // Save to storage
  storageManager.setServingsMultiplier(creationKey.value, newMultiplier)
  
  // Update card data attribute
  if (cardElement.value) {
    cardElement.value.dataset.servingsAdjustment = newMultiplier.toString()
  }
  
  // If returning to 1x, we need to restore original values
  if (newMultiplier === 1) {
    restoreOriginalValues()
  } else {
    // Update yield and ingredients
    updateYield()
    updateIngredients()
  }
}

function restoreOriginalValues() {
  if (!cardElement.value) return
  
  // Restore original yield
  if (originalYield.value) {
    let yieldElement = cardElement.value.querySelector('.mv-create-time-yield .mv-create-time-format') ||
                      cardElement.value.querySelector('.mv-create-yield') ||
                      cardElement.value.querySelector('.mv-create-nutrition-yield')
    
    if (yieldElement) {
      yieldElement.textContent = originalYield.value
    }
  }
  
  // Restore original ingredients
  const ingredients = cardElement.value.querySelectorAll('.mv-create-ingredients li')
  ingredients.forEach((ingredient, index) => {
    const originalData = originalAmounts.get(index)
    if (originalData) {
      // Handle linked ingredients
      const link = ingredient.querySelector('a')
      if (link) {
        const linkText = link.textContent || ''
        const linkHref = link.getAttribute('href') || ''
        
        if (linkText && originalData.text.includes(linkText)) {
          const parts = originalData.text.split(linkText)
          ingredient.innerHTML = `${parts[0]}<a href="${linkHref}">${linkText}</a>${parts[1] || ''}`
        } else {
          ingredient.textContent = originalData.text
        }
      } else {
        ingredient.textContent = originalData.text
      }
    }
  })
}

function updateYield() {
  if (!cardElement.value || !originalYield.value) return

  // Find the yield element
  let yieldElement = cardElement.value.querySelector('.mv-create-time-yield .mv-create-time-format') ||
                    cardElement.value.querySelector('.mv-create-yield') ||
                    cardElement.value.querySelector('.mv-create-nutrition-yield')
  
  if (!yieldElement) return

  // Parse the original yield (e.g., "8 servings", "12 cookies", or "Yield: 4")
  let yieldMatch = originalYield.value.match(/^(\d+(?:\.\d+)?)\s*(.*)$/) // "4 servings"
  
  if (!yieldMatch) {
    yieldMatch = originalYield.value.match(/^(.*?):\s*(\d+(?:\.\d+)?)\s*(.*)$/) // "Yield: 4"
    if (yieldMatch) {
      const prefix = yieldMatch[1] // "Yield"
      const originalNumber = parseFloat(yieldMatch[2])
      const unit = yieldMatch[3] // remaining text
      const newNumber = originalNumber * currentMultiplier.value
      
      // Format the number (remove unnecessary decimals)
      const formattedNumber = newNumber % 1 === 0 ? newNumber.toString() : newNumber.toFixed(1)
      
      yieldElement.textContent = `${prefix}: ${formattedNumber} ${unit}`.trim()
      return
    }
  }
  
  if (yieldMatch) {
    const originalNumber = parseFloat(yieldMatch[1])
    const unit = yieldMatch[2]
    const newNumber = originalNumber * currentMultiplier.value
    
    // Format the number (remove unnecessary decimals)
    const formattedNumber = newNumber % 1 === 0 ? newNumber.toString() : newNumber.toFixed(1)
    
    yieldElement.textContent = `${formattedNumber} ${unit}`.trim()
  }
}

function updateIngredients() {
  if (!cardElement.value) return

  const ingredients = cardElement.value.querySelectorAll('.mv-create-ingredients li')
  
  ingredients.forEach((ingredient, index) => {
    const originalData = originalAmounts.get(index)
    if (!originalData || !originalData.amount) return

    const adjustedAmount = calculateAdjustedAmount(originalData.amount)
    
    
    if (adjustedAmount) {
      // Get the full original text
      const originalText = originalData.text
      
      // Try to find where the amount appears in the text
      // First try exact match at the beginning
      const escapedAmount = originalData.amount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      let amountPattern = new RegExp(`^${escapedAmount}\\s+`)
      let newText = originalText.replace(amountPattern, adjustedAmount + ' ')
      
      // If no replacement was made, the amount might not be at the start or might have different formatting
      if (newText === originalText) {
        // Try to find the amount anywhere in the text
        amountPattern = new RegExp(`\\b${escapedAmount}\\b`)
        newText = originalText.replace(amountPattern, adjustedAmount)
        
        // If still no replacement, just prepend the new amount
        if (newText === originalText) {
          // Remove any leading number that might be wrong
          const textWithoutNumber = originalText.replace(/^\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?\s+/, '')
          newText = adjustedAmount + ' ' + textWithoutNumber
        }
      }
      
      // Handle linked ingredients
      const link = ingredient.querySelector('a')
      if (link) {
        // If there's a link, we need to preserve it
        const linkText = link.textContent || ''
        const linkHref = link.getAttribute('href') || ''
        
        // Split the new text around where the link should be
        if (linkText && newText.includes(linkText)) {
          const parts = newText.split(linkText)
          ingredient.innerHTML = `${parts[0]}<a href="${linkHref}">${linkText}</a>${parts[1] || ''}`
        } else {
          ingredient.textContent = newText
        }
      } else {
        ingredient.textContent = newText
      }
    }
  })
}

function calculateAdjustedAmount(amount: string): string | null {
  // First, extract just the numeric part (remove units like "cups", "teaspoons", etc.)
  const parts = amount.match(/^([\d\s\/\.\-]+)(.*)$/)
  if (!parts) return null
  
  const numericPart = parts[1].trim()
  const unitPart = parts[2].trim()
  
  let adjustedNumeric: string | null = null
  
  // Check for mixed fractions first (e.g., "2 1/4")
  if (/^\d+\s+\d+\/\d+$/.test(numericPart)) {
    adjustedNumeric = adjustFraction(numericPart)
  }
  // Handle simple fractions (e.g., "1/2")
  else if (numericPart.includes('/')) {
    adjustedNumeric = adjustFraction(numericPart)
  }
  // Handle ranges
  else if (numericPart.includes('-')) {
    const rangeParts = numericPart.split('-').map(p => p.trim())
    const adjustedParts = rangeParts.map(part => {
      // Check if the part is a fraction
      if (part.includes('/')) {
        return adjustFraction(part) || part
      }
      const num = parseFloat(part)
      if (!isNaN(num)) {
        return formatNumber(num * currentMultiplier.value)
      }
      return part
    })
    adjustedNumeric = adjustedParts.join('-')
  }
  // Handle regular numbers
  else {
    const num = parseFloat(numericPart)
    if (!isNaN(num)) {
      adjustedNumeric = formatNumber(num * currentMultiplier.value)
    }
  }
  
  // Return the adjusted amount with the unit if present
  if (adjustedNumeric) {
    return unitPart ? `${adjustedNumeric} ${unitPart}` : adjustedNumeric
  }
  
  return null
}

function adjustFraction(fraction: string): string | null {
  // Handle mixed fractions like "1 1/2"
  const mixedMatch = fraction.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1])
    const numerator = parseInt(mixedMatch[2])
    const denominator = parseInt(mixedMatch[3])
    const decimal = whole + (numerator / denominator)
    const adjusted = decimal * currentMultiplier.value
    return decimalToFraction(adjusted)
  }
  
  // Handle simple fractions like "1/2"
  const simpleMatch = fraction.match(/^(\d+)\/(\d+)$/)
  if (simpleMatch) {
    const numerator = parseInt(simpleMatch[1])
    const denominator = parseInt(simpleMatch[2])
    const decimal = numerator / denominator
    const adjusted = decimal * currentMultiplier.value
    return decimalToFraction(adjusted)
  }
  
  return null
}

function decimalToFraction(decimal: number): string {
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

function formatNumber(num: number): string {
  // Remove unnecessary decimals
  if (num % 1 === 0) {
    return num.toString()
  }
  
  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100
  return rounded.toString()
}
</script>