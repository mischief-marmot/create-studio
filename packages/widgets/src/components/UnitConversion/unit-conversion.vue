<template>
  <div class="cs-unit-conversion" role="group" :aria-label="labelText">
    <button
      type="button"
      class="cs-unit-conversion-btn"
      :class="{ active: activeSystem === US_CUSTOMARY }"
      :aria-pressed="activeSystem === US_CUSTOMARY"
      @click="setSystem(US_CUSTOMARY)"
    >
      US
    </button>
    <button
      type="button"
      class="cs-unit-conversion-btn"
      :class="{ active: activeSystem === METRIC }"
      :aria-pressed="activeSystem === METRIC"
      @click="setSystem(METRIC)"
    >
      Metric
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { SharedStorageManager } from '@create-studio/shared/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '@create-studio/shared/utils/domain'
import {
  US_CUSTOMARY,
  METRIC,
  getInitialSystem,
  systemToPreference,
  migrateLegacyUnitPreference,
  type MeasurementSystem,
  type UnitConversionConfig
} from '@create-studio/shared/utils/unit-conversion'
import { transformIngredient } from '@create-studio/shared/utils/ingredient-pipeline'

interface Props {
  config: {
    creationId: string
    siteUrl?: string
    theme?: Record<string, string>
    unitConversion: UnitConversionConfig
  }
  storage?: any
}

const props = defineProps<Props>()

const globalConfig = inject<any>('widgetConfig')
const storageManager = new SharedStorageManager()

const activeSystem = ref<MeasurementSystem>(US_CUSTOMARY)

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

const labelText = computed(() => {
  return props.config.unitConversion?.label || 'Unit Conversion'
})

onMounted(() => {
  initializeWidget()
})

function initializeWidget() {
  if (!cardElement.value) return

  const unitConfig = props.config.unitConversion
  if (!unitConfig?.enabled) return

  // Initialize creation in shared storage
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  storageManager.initializeCreation(domain, props.config.creationId)

  // One-time migration: check legacy localStorage key
  const legacySystem = migrateLegacyUnitPreference()
  if (legacySystem) {
    storageManager.setUnitPreference(systemToPreference(legacySystem))
  }

  // Determine initial system: saved preference > locale > default
  const savedPref = storageManager.getUnitPreference()
  activeSystem.value = getInitialSystem(unitConfig.default_system, savedPref)

  // Stamp originals and apply if not source system
  stampOriginalTexts()
  if (activeSystem.value !== unitConfig.source_system) {
    applyPipeline()
  }
}

function setSystem(system: MeasurementSystem) {
  if (system === activeSystem.value) return

  activeSystem.value = system
  storageManager.setUnitPreference(systemToPreference(system))

  applyPipeline()

  // Dispatch event for ServingsAdjuster coordination
  if (cardElement.value) {
    cardElement.value.dispatchEvent(new CustomEvent('cs:unit-conversion-changed', {
      bubbles: true,
      detail: { system }
    }))
  }
}

/**
 * Stamp each ingredient <li> with data-cs-original-text on first interaction.
 * Guard: only if not already present (ServingsAdjuster may have stamped first).
 */
function stampOriginalTexts() {
  if (!cardElement.value) return

  const ingredients = cardElement.value.querySelectorAll('.mv-create-ingredients li[data-ingredient-id]')
  ingredients.forEach((li) => {
    if (!li.hasAttribute('data-cs-original-text')) {
      li.setAttribute('data-cs-original-text', li.textContent?.trim() || '')
    }
  })
}

/**
 * Apply the full transform pipeline (unit conversion + servings) to all ingredients.
 */
function applyPipeline() {
  if (!cardElement.value) return

  const unitConfig = props.config.unitConversion
  const servingsMultiplier = storageManager.getServingsMultiplier(creationKey.value)

  const ingredients = cardElement.value.querySelectorAll('.mv-create-ingredients li[data-ingredient-id]')

  ingredients.forEach((li) => {
    const id = li.getAttribute('data-ingredient-id')
    const originalText = li.getAttribute('data-cs-original-text') || li.textContent?.trim() || ''

    const transformed = transformIngredient(
      originalText,
      id,
      unitConfig,
      activeSystem.value,
      servingsMultiplier
    )

    updateIngredientText(li, transformed)

    // Toggle conversion class
    if (activeSystem.value !== unitConfig.source_system) {
      li.classList.add('mv-unit-converted')
    } else {
      li.classList.remove('mv-unit-converted')
    }
  })
}

/**
 * Update ingredient text while preserving non-text child elements
 * (checkboxes from Checklists plugin, links, etc.)
 *
 * IMPORTANT: We detach and re-insert the ORIGINAL elements rather than
 * cloning them. cloneNode() loses event listeners, which breaks the
 * Checklists plugin's click handlers (change on checkbox, click on li
 * with closure over the checkbox reference).
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
    const linkHref = link.getAttribute('href') || ''

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
</script>
