<template>
  <div class="cs-servings-adjuster">
    <div class="cs-servings-adjuster-inner">
      <span class="cs-servings-adjuster-label">{{ labelText }}</span>
      <div class="cs-servings-adjuster-buttons" role="group" :aria-label="labelText">
        <span
          v-for="multiplier in availableMultipliers"
          :key="multiplier"
          class="cs-servings-adjuster-btn"
          :class="{ active: currentMultiplier === multiplier }"
          :data-multiplier="multiplier"
          :aria-pressed="currentMultiplier === multiplier"
          @click="handleMultiplierChange(multiplier)"
        >
          {{ multiplier }}x
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject, nextTick } from 'vue'
import { SharedStorageManager } from '@create-studio/shared/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '@create-studio/shared/utils/domain'
import { transformIngredient } from '@create-studio/shared/utils/ingredient-pipeline'
import type { UnitConversionConfig, MeasurementSystem } from '@create-studio/shared/utils/unit-conversion'
import { preferenceToSystem } from '@create-studio/shared/utils/unit-conversion'

interface Props {
  config: {
    creationId: string
    creationName?: string
    defaultMultiplier?: number
    siteUrl?: string
    theme?: Record<string, string>
    label?: string
  }
  storage?: any
}

const props = defineProps<Props>()

const globalConfig = inject<any>('widgetConfig')
const storageManager = new SharedStorageManager()

const currentMultiplier = ref(1)
const availableMultipliers = [1, 2, 3]
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

// Get the label text from config or use default
const labelText = computed(() => {
  return props.config.label || 'Adjust Servings'
})

/**
 * Read unit conversion config from the card element.
 * Checks data-cs-config first, then falls back to data-unit-conversions.
 */
function getUnitConversionConfig(): UnitConversionConfig | null {
  if (!cardElement.value) return null

  // Try consolidated config first
  const csConfigAttr = cardElement.value.getAttribute('data-cs-config')
  if (csConfigAttr) {
    try {
      const csConfig = JSON.parse(csConfigAttr)
      if (csConfig.unitConversion?.enabled) return csConfig.unitConversion
    } catch { /* ignore */ }
  }

  // Fallback to legacy attribute
  const legacyAttr = cardElement.value.getAttribute('data-unit-conversions')
  if (legacyAttr) {
    try {
      const config = JSON.parse(legacyAttr)
      if (config?.enabled) return config
    } catch { /* ignore */ }
  }

  return null
}

/**
 * Get the active unit conversion system from SharedStorageManager.
 */
function getActiveUnitSystem(): MeasurementSystem | null {
  const pref = storageManager.getUnitPreference()
  return preferenceToSystem(pref)
}

// Event handler reference for cleanup
function handleUnitConversionChanged() {
  applyPipeline()
}

onMounted(() => {
  initializeWidget()
})

onBeforeUnmount(() => {
  // Remove unit conversion event listener
  if (cardElement.value) {
    cardElement.value.removeEventListener('cs:unit-conversion-changed', handleUnitConversionChanged)
  }
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

  // Store original data
  storeOriginalYield()
  stampOriginalTexts()

  // Apply current multiplier if not 1x
  if (currentMultiplier.value !== 1) {
    updateYield()
    applyPipeline()
  }

  // Listen for unit conversion changes to re-apply pipeline
  cardElement.value.addEventListener('cs:unit-conversion-changed', handleUnitConversionChanged)
}

/**
 * Stamp each ingredient <li> with data-cs-original-text.
 * Guard: only if not already present (UnitConversion may have stamped first).
 */
function stampOriginalTexts() {
  if (!cardElement.value) return

  const ingredients = cardElement.value.querySelectorAll('.mv-create-ingredients li')
  ingredients.forEach((li) => {
    if (!li.hasAttribute('data-cs-original-text')) {
      li.setAttribute('data-cs-original-text', li.textContent?.trim() || '')
    }
  })
}

function storeOriginalYield() {
  if (!cardElement.value) return

  // Find the yield element - try multiple possible locations
  const yieldElement = cardElement.value.querySelector('.mv-create-time-yield .mv-create-time-format') ||
                    cardElement.value.querySelector('.mv-create-yield') ||
                    cardElement.value.querySelector('.mv-create-nutrition-yield')

  if (yieldElement) {
    originalYield.value = yieldElement.textContent?.trim() || null
  }
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

  // Always update yield
  updateYield()

  // Apply the full pipeline (handles both 1x restoration and multiplication,
  // and respects active unit conversion)
  applyPipeline()
}

/**
 * Apply the shared ingredient transformation pipeline to all ingredients.
 * Reads unit conversion state from SharedStorageManager so servings changes
 * respect any active unit conversion.
 */
function applyPipeline() {
  if (!cardElement.value) return

  const unitConfig = getUnitConversionConfig()
  const targetSystem = getActiveUnitSystem()

  const ingredients = cardElement.value.querySelectorAll('.mv-create-ingredients li')

  ingredients.forEach((ingredient) => {
    const id = (ingredient as HTMLElement).getAttribute('data-ingredient-id')
    const originalText = ingredient.getAttribute('data-cs-original-text') || ingredient.textContent?.trim() || ''

    const transformed = transformIngredient(
      originalText,
      id,
      unitConfig,
      targetSystem,
      currentMultiplier.value
    )

    updateIngredientText(ingredient, transformed)
  })
}

/**
 * Update ingredient text while preserving non-text child elements
 * (checkboxes from Checklists plugin, links, etc.)
 *
 * IMPORTANT: We detach and re-insert the ORIGINAL elements rather than
 * cloning them. cloneNode() loses event listeners, which breaks the
 * Checklists plugin's click handlers.
 */
function updateIngredientText(li: Element, text: string) {
  const link = li.querySelector('a')
  const checkbox = li.querySelector('input[type="checkbox"]')

  // Detach elements we want to preserve (removing from DOM but keeping references)
  if (checkbox) checkbox.remove()
  if (link) link.remove()

  // Set new text (clears remaining child nodes)
  li.textContent = text

  // Re-insert preserved link if the text contains the link text
  if (link) {
    const linkText = link.textContent || ''

    if (linkText && text.includes(linkText)) {
      const textNode = li.firstChild
      if (textNode) {
        const fullText = textNode.textContent || ''
        const splitIdx = fullText.indexOf(linkText)
        if (splitIdx >= 0) {
          const before = fullText.substring(0, splitIdx)
          const after = fullText.substring(splitIdx + linkText.length)
          li.textContent = ''
          if (before) li.appendChild(document.createTextNode(before))
          li.appendChild(link)
          if (after) li.appendChild(document.createTextNode(after))
        }
      }
    }
  }

  // Re-insert original checkbox as first child (preserves event listeners)
  if (checkbox) {
    li.insertBefore(checkbox, li.firstChild)
  }
}

function updateYield() {
  if (!cardElement.value || !originalYield.value) return

  // Find the yield element
  const yieldElement = cardElement.value.querySelector('.mv-create-time-yield .mv-create-time-format') ||
                    cardElement.value.querySelector('.mv-create-yield') ||
                    cardElement.value.querySelector('.mv-create-nutrition-yield')

  if (!yieldElement) return

  if (currentMultiplier.value === 1) {
    yieldElement.textContent = originalYield.value
    return
  }

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
</script>
